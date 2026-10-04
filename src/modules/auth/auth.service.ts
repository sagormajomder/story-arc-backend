import { env } from '@src/config/env.js';
import type {
  ICreateRefreshTokenInput,
  IDeviceInfo,
  LoginResultDto,
  RegisterResultDto,
  TokensResultDto,
} from '@src/modules/auth/auth.types.js';
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from '@src/modules/auth/auth.validate.js';
import {
  passwordResetTokenRepository,
  type IPasswordResetTokenRepository,
} from '@src/modules/auth/password-reset-token.repository.js';
import {
  refreshTokenRepository,
  type IRefreshTokenRepository,
} from '@src/modules/auth/refresh-token.repository.js';
import {
  userService,
  type IUserService,
} from '@src/modules/user/user.index.js';
import { AppError } from '@src/shared/errors/appError.js';
import {
  emailService,
  type IEmailService,
} from '@src/shared/services/email.service.js';
import {
  argon2PasswordHasher,
  sha256TokenHasher,
  type IPasswordHasher,
  type ITokenHasher,
} from '@src/shared/services/hasher.service.js';
import {
  tokenService,
  type ITokenService,
} from '@src/shared/services/token.service.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';
import { logger } from '@src/shared/utils/logger.js';
import { randomBytes, randomUUID } from 'node:crypto';

export interface IAuthService {
  register(registerDto: RegisterDto): Promise<RegisterResultDto>;
  login(loginDto: LoginDto, deviceInfo?: IDeviceInfo): Promise<LoginResultDto>;
  refreshTokens(
    refreshToken: string,
    deviceInfo?: IDeviceInfo,
  ): Promise<TokensResultDto>;
  logout(refreshToken: string): Promise<void>;
  forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void>;
  resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void>;
}

export class AuthService implements IAuthService {
  constructor(
    private readonly userSvc: IUserService = userService,
    private readonly passwordHasher: IPasswordHasher = argon2PasswordHasher,
    private readonly tokenSvc: ITokenService = tokenService,
    private readonly tokenHasher: ITokenHasher = sha256TokenHasher,
    private readonly refreshTokenRepo: IRefreshTokenRepository = refreshTokenRepository,
    private readonly resetTokenRepo: IPasswordResetTokenRepository = passwordResetTokenRepository,
    private readonly emailSvc: IEmailService = emailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResultDto> {
    const existingUser = await this.userSvc.findByEmail(registerDto.email);
    if (existingUser) {
      throw new AppError(
        'Unable to complete registration. Please check your details or try logging in.',
        HTTP_STATUS.CONFLICT,
      );
    }

    return this.userSvc.createUser(registerDto);
  }

  async login(
    loginDto: LoginDto,
    deviceInfo?: IDeviceInfo,
  ): Promise<LoginResultDto> {
    const existingUser = await this.userSvc.findByEmail(loginDto.email, true);

    const isPasswordMatched = await this.passwordHasher.compare(
      loginDto.password,
      existingUser?.password,
    );

    if (!existingUser || !isPasswordMatched) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    const familyId = randomUUID();

    const tokenPayload = {
      userId: existingUser.id,
      email: existingUser.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenSvc.generateAccessToken(tokenPayload),
      this.tokenSvc.generateRefreshToken({
        ...tokenPayload,
        familyId,
      }),
    ]);

    const tokenHash = this.tokenHasher.hash(refreshToken);
    const expiresAt = new Date(Date.now() + env.COOKIE_REFRESH_TOKEN_MAX_AGE);

    const tokenInput: ICreateRefreshTokenInput = {
      userId: existingUser.id,
      familyId,
      tokenHash,
      expiresAt,
      isRevoked: false,
    };
    if (deviceInfo) {
      tokenInput.deviceInfo = {
        userAgent: deviceInfo.userAgent || 'unknown',
        ip: deviceInfo.ip || 'unknown',
      };
    }
    await this.refreshTokenRepo.create(tokenInput);

    const userWithoutPassword = excludeFields(existingUser, ['password']);

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(
    oldRefreshToken: string,
    deviceInfo?: IDeviceInfo,
  ): Promise<TokensResultDto> {
    const payload = await this.tokenSvc.verifyRefreshToken(oldRefreshToken);

    const tokenHash = this.tokenHasher.hash(oldRefreshToken);
    const storedToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    // Reuse detection:
    // If the token is not found in DB OR was already marked as revoked/used:
    if (!storedToken || storedToken.isRevoked) {
      const familyId =
        storedToken?.familyId ?? (payload.familyId as string | undefined);

      if (familyId) {
        logger.warn(
          { userId: payload.userId, familyId },
          'Refresh token reuse detected! Revoking all tokens in session family.',
        );
        await this.refreshTokenRepo.deleteAllByFamilyId(familyId);
      }

      throw new AppError(
        'Invalid or revoked refresh token',
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // Token Rotation: mark the previous refresh token as revoked immediately
    await this.refreshTokenRepo.markAsRevoked(tokenHash);

    const familyId = storedToken.familyId;

    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
    };

    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.tokenSvc.generateAccessToken(tokenPayload),
      this.tokenSvc.generateRefreshToken({
        ...tokenPayload,
        familyId,
      }),
    ]);

    const newTokenHash = this.tokenHasher.hash(newRefreshToken);
    const expiresAt = new Date(Date.now() + env.COOKIE_REFRESH_TOKEN_MAX_AGE);

    const effectiveDeviceInfo: IDeviceInfo = {
      userAgent:
        storedToken.deviceInfo?.userAgent ?? deviceInfo?.userAgent ?? 'unknown',
      ip:
        deviceInfo?.ip && deviceInfo.ip !== 'unknown'
          ? deviceInfo.ip
          : (storedToken.deviceInfo?.ip ?? 'unknown'),
    };

    const tokenInput: ICreateRefreshTokenInput = {
      userId: payload.userId,
      familyId,
      tokenHash: newTokenHash,
      expiresAt,
      isRevoked: false,
      deviceInfo: effectiveDeviceInfo,
    };
    await this.refreshTokenRepo.create(tokenInput);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const tokenHash = this.tokenHasher.hash(refreshToken);
      const storedToken =
        await this.refreshTokenRepo.findByTokenHash(tokenHash);

      if (storedToken?.familyId) {
        await this.refreshTokenRepo.deleteAllByFamilyId(storedToken.familyId);
        return;
      }

      try {
        const payload = await this.tokenSvc.verifyRefreshToken(refreshToken);
        if (payload.familyId) {
          await this.refreshTokenRepo.deleteAllByFamilyId(
            payload.familyId as string,
          );
          return;
        }
      } catch {
        // Silently ignore if token verification fails
      }

      await this.refreshTokenRepo.deleteByTokenHash(tokenHash);
    } catch {
      // Silently ignore to ensure logout always succeeds
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.userSvc.findByEmail(forgotPasswordDto.email);

    // Always return without error to prevent email enumeration
    if (!user) {
      return;
    }

    // Delete any existing reset tokens for this user
    await this.resetTokenRepo.deleteAllByUserId(user.id);

    // Generate cryptographically secure random token (32 bytes = 64 hex characters)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.tokenHasher.hash(rawToken);

    const MINUTE = 60 * 1000;
    const expiresAt = new Date(
      Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * MINUTE,
    );

    await this.resetTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Build reset URL using Fragment identifier (#token=) to prevent token leakage in server logs & Referer
    const clientUrl = env.CLIENT_URLS[0];
    const resetUrl = `${clientUrl}/reset-password#token=${rawToken}`;

    // Send email
    await this.emailSvc.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Story Arc',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #4F46E5;">Password Reset Request</h2>
          <p>Hi ${user.fullName},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #4F46E5; color: white; padding: 12px 32px;
                      text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in <strong>${env.PASSWORD_RESET_EXPIRES_MINUTES} minutes</strong>.</p>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #4F46E5;">${resetUrl}</a>
          </p>
        </div>
      `,
      text: `Hi ${user.fullName},\n\nReset your password using this link: ${resetUrl}\n\nThis link expires in ${env.PASSWORD_RESET_EXPIRES_MINUTES} minutes.\n\nIf you didn't request this, please ignore this email.`,
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.tokenHasher.hash(resetPasswordDto.token);
    const storedToken = await this.resetTokenRepo.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new AppError(
        'Invalid or expired password reset token',
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Verify user still exists
    const user = await this.userSvc.findById(storedToken.userId, true);
    if (!user) {
      throw new AppError(
        'Invalid or expired password reset token',
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (user.password) {
      const isSamePassword = await this.passwordHasher.compare(
        resetPasswordDto.newPassword,
        user.password,
      );
      if (isSamePassword) {
        throw new AppError(
          'New password cannot be the same as the previous password',
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }

    // Update password
    await this.userSvc.updatePassword(user.id, resetPasswordDto.newPassword);

    // Delete ALL reset tokens for this user (one-time use)
    await this.resetTokenRepo.deleteAllByUserId(user.id);

    // Invalidate ALL refresh tokens (force re-login on all devices)
    await this.refreshTokenRepo.deleteAllByUserId(user.id);
  }
}

export const authService = new AuthService();
