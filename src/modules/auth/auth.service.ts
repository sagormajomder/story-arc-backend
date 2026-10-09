import { env } from '@src/config/env.js';
import { authMailer, type IAuthMailer } from '@src/modules/auth/auth.mailer.js';
import type {
  ICreateRefreshTokenInput,
  IDeviceInfo,
  LoginResultDto,
  TokensResultDto,
} from '@src/modules/auth/auth.types.js';
import type {
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '@src/modules/auth/auth.validate.js';
import {
  emailVerificationTokenRepository,
  type IEmailVerificationTokenRepository,
} from '@src/modules/auth/email-verification-token.repository.js';
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
  argon2PasswordHasher,
  sha256TokenHasher,
  type IPasswordHasher,
  type ITokenHasher,
} from '@src/shared/services/hasher.service.js';
import {
  tokenService,
  type ITokenService,
} from '@src/shared/services/token.service.js';
import {
  HTTP_STATUS,
  TIME_MS,
  VALIDATIONS,
} from '@src/shared/utils/constants.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';
import { logger } from '@src/shared/utils/logger.js';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes, randomUUID } from 'node:crypto';

export interface IAuthService {
  register(registerDto: RegisterDto): Promise<void>;
  verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void>;
  resendVerification(
    resendVerificationDto: ResendVerificationDto,
  ): Promise<void>;
  login(loginDto: LoginDto, deviceInfo?: IDeviceInfo): Promise<LoginResultDto>;
  googleLogin(
    googleLoginDto: GoogleLoginDto,
    deviceInfo?: IDeviceInfo,
  ): Promise<LoginResultDto>;
  refreshTokens(
    refreshToken: string,
    deviceInfo?: IDeviceInfo,
  ): Promise<TokensResultDto>;
  logout(refreshToken: string): Promise<void>;
  forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void>;
  resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void>;
}

export class AuthService implements IAuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly userSvc: IUserService = userService,
    private readonly passwordHasher: IPasswordHasher = argon2PasswordHasher,
    private readonly tokenSvc: ITokenService = tokenService,
    private readonly tokenHasher: ITokenHasher = sha256TokenHasher,
    private readonly refreshTokenRepo: IRefreshTokenRepository = refreshTokenRepository,
    private readonly resetTokenRepo: IPasswordResetTokenRepository = passwordResetTokenRepository,
    private readonly verificationTokenRepo: IEmailVerificationTokenRepository = emailVerificationTokenRepository,
    private readonly mailer: IAuthMailer = authMailer,
  ) {
    this.googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  private async verifyGoogleIdToken(idToken: string) {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError(
        'Google authentication is not configured',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new AppError('Invalid Google ID token', HTTP_STATUS.UNAUTHORIZED);
      }
      return payload;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.warn({ error }, 'Google ID token verification failed');
      throw new AppError(
        'Failed to verify Google token',
        HTTP_STATUS.UNAUTHORIZED,
      );
    }
  }

  private async verifyGoogleAccessToken(accessToken: string) {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError(
        'Google authentication is not configured',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new AppError('Invalid Google access token', HTTP_STATUS.UNAUTHORIZED);
      }

      const data = (await res.json()) as {
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
        email_verified?: boolean | string;
      };

      if (!data.sub || !data.email) {
        throw new AppError('Invalid Google user profile', HTTP_STATUS.UNAUTHORIZED);
      }

      return {
        sub: data.sub,
        email: data.email,
        name: data.name,
        picture: data.picture,
        email_verified: data.email_verified === true || data.email_verified === 'true',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.warn({ error }, 'Google access token verification failed');
      throw new AppError(
        'Failed to verify Google access token',
        HTTP_STATUS.UNAUTHORIZED,
      );
    }
  }


  private generateOpaqueToken(): { rawToken: string; tokenHash: string } {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.tokenHasher.hash(rawToken);
    return { rawToken, tokenHash };
  }

  private async issueSessionTokens(
    userId: string,
    email: string,
    familyId: string,
    deviceInfo?: IDeviceInfo,
  ): Promise<TokensResultDto> {
    const tokenPayload = {
      userId,
      email,
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
      userId,
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

    return {
      accessToken,
      refreshToken,
    };
  }

  private async sendVerificationEmailFlow(
    userId: string,
    email: string,
    fullName: string,
  ): Promise<void> {
    await this.verificationTokenRepo.deleteAllByUserId(userId);

    const { rawToken, tokenHash } = this.generateOpaqueToken();
    const expiresAt = new Date(
      Date.now() + env.EMAIL_VERIFICATION_EXPIRES_HOURS * TIME_MS.HOUR,
    );

    await this.verificationTokenRepo.create({
      userId,
      tokenHash,
      expiresAt,
    });

    await this.mailer.sendVerificationEmail(email, fullName, rawToken);
  }

  async register(registerDto: RegisterDto): Promise<void> {
    const existingUser = await this.userSvc.findByEmail(registerDto.email);

    if (!existingUser) {
      const { user } = await this.userSvc.createUser({
        ...registerDto,
        isEmailVerified: false,
        authProviders: ['local'],
      });

      await this.sendVerificationEmailFlow(user.id, user.email, user.fullName);
      return;
    }

    if (
      existingUser.authProviders?.includes('google') &&
      !existingUser.authProviders?.includes('local')
    ) {
      await this.mailer.sendGoogleAccountNoticeEmail(
        existingUser.email,
        existingUser.fullName,
      );
      return;
    }

    if (existingUser.isEmailVerified) {
      await this.mailer.sendAccountAlreadyExistsEmail(
        existingUser.email,
        existingUser.fullName,
      );
      return;
    }

    await this.sendVerificationEmailFlow(
      existingUser.id,
      existingUser.email,
      existingUser.fullName,
    );
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    const tokenHash = this.tokenHasher.hash(verifyEmailDto.token);
    const storedToken =
      await this.verificationTokenRepo.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new AppError(
        'Invalid or expired verification token',
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const user = await this.userSvc.findById(storedToken.userId);
    if (!user) {
      throw new AppError(
        'Invalid or expired verification token',
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    await this.userSvc.markEmailAsVerified(user.id);
    await this.verificationTokenRepo.deleteAllByUserId(user.id);

    try {
      await this.mailer.sendRegistrationSuccessEmail(user.email, user.fullName);
    } catch (error) {
      logger.error(
        { error, userId: user.id, email: user.email },
        'Failed to send registration success confirmation email',
      );
    }
  }

  async resendVerification(
    resendVerificationDto: ResendVerificationDto,
  ): Promise<void> {
    const user = await this.userSvc.findByEmail(resendVerificationDto.email);

    if (!user || user.isEmailVerified) {
      return;
    }

    await this.sendVerificationEmailFlow(user.id, user.email, user.fullName);
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

    if (!existingUser.isEmailVerified) {
      throw new AppError(
        'Please verify your email address before logging in.',
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const familyId = randomUUID();
    const { accessToken, refreshToken } = await this.issueSessionTokens(
      existingUser.id,
      existingUser.email,
      familyId,
      deviceInfo,
    );

    return {
      user: excludeFields(existingUser, [
        'password',
        'authProviders',
        'isEmailVerified',
        'googleId',
      ]),
      accessToken,
      refreshToken,
    };
  }

  async googleLogin(
    googleLoginDto: GoogleLoginDto,
    deviceInfo?: IDeviceInfo,
  ): Promise<LoginResultDto> {
    const payload = googleLoginDto.accessToken
      ? await this.verifyGoogleAccessToken(googleLoginDto.accessToken)
      : await this.verifyGoogleIdToken(googleLoginDto.idToken!);
    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email_verified || !email) {
      throw new AppError(
        'Google account email is not verified',
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 1. Check if user already exists with this googleId
    let user = await this.userSvc.findByGoogleId(googleId);

    if (user) {
      // Subsequent / Recurring Google login -> NO EMAIL SENT
      const familyId = randomUUID();
      const { accessToken, refreshToken } = await this.issueSessionTokens(
        user.id,
        user.email,
        familyId,
        deviceInfo,
      );

      return {
        user: excludeFields(user, [
          'password',
          'authProviders',
          'isEmailVerified',
          'googleId',
        ]),
        accessToken,
        refreshToken,
      };
    }

    // 2. User not found by googleId -> Check by email
    const existingUserByEmail = await this.userSvc.findByEmail(email);

    if (existingUserByEmail) {
      if (existingUserByEmail.isEmailVerified) {
        // CASE: Existing verified local user -> Auto-link Google
        user = await this.userSvc.linkGoogleAccount(
          existingUserByEmail.id,
          googleId,
          picture,
        );

        // Security Alert Email: notify that Google login was linked
        try {
          await this.mailer.sendGoogleAccountLinkedSecurityEmail(
            user.email,
            user.fullName,
          );
        } catch (error) {
          logger.error(
            { error, userId: user.id, email: user.email },
            'Failed to send Google account linked security email',
          );
        }
      } else {
        // CASE: Existing unverified account -> Pre-hijacking prevention: Wipe unverified password and claim as Google account
        user = await this.userSvc.claimAccountAsGoogle(
          existingUserByEmail.id,
          googleId,
          picture,
        );

        // First-time verified onboarding via Google -> Welcome Email
        try {
          await this.mailer.sendGoogleWelcomeEmail(user.email, user.fullName);
        } catch (error) {
          logger.error(
            { error, userId: user.id, email: user.email },
            'Failed to send Google welcome email',
          );
        }
      }
    } else {
      // CASE: Brand new user -> Create user
      user = await this.userSvc.createGoogleUser({
        fullName: name || 'Google User',
        email,
        profileImage: picture || VALIDATIONS.DEFAULT_PROFILE_IMAGE,
        googleId,
      });

      // First-time registration -> Welcome Email
      try {
        await this.mailer.sendGoogleWelcomeEmail(user.email, user.fullName);
      } catch (error) {
        logger.error(
          { error, userId: user.id, email: user.email },
          'Failed to send Google welcome email',
        );
      }
    }

    // 3. Issue session tokens
    const familyId = randomUUID();
    const { accessToken, refreshToken } = await this.issueSessionTokens(
      user.id,
      user.email,
      familyId,
      deviceInfo,
    );

    return {
      user: excludeFields(user, [
        'password',
        'authProviders',
        'isEmailVerified',
        'googleId',
      ]),
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
    if (!storedToken) {
      const familyId = payload.familyId as string | undefined;
      if (familyId) {
        logger.warn(
          { userId: payload.userId, familyId },
          'Unknown refresh token used! Revoking session family.',
        );
        await this.refreshTokenRepo.deleteAllByFamilyId(familyId);
      }
      throw new AppError(
        'Invalid or revoked refresh token',
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (storedToken.isRevoked) {
      const isWithinGracePeriod =
        storedToken.updatedAt &&
        Date.now() - new Date(storedToken.updatedAt).getTime() < 30 * TIME_MS.SECOND;

      if (!isWithinGracePeriod) {
        const familyId = storedToken.familyId;
        logger.warn(
          { userId: payload.userId, familyId },
          'Refresh token reuse detected beyond grace period! Revoking all tokens in session family.',
        );
        await this.refreshTokenRepo.deleteAllByFamilyId(familyId);

        throw new AppError(
          'Invalid or revoked refresh token',
          HTTP_STATUS.UNAUTHORIZED,
        );
      }
    }

    // Token Rotation: mark the previous refresh token as revoked immediately
    await this.refreshTokenRepo.markAsRevoked(tokenHash);

    const effectiveDeviceInfo: IDeviceInfo = {
      userAgent:
        storedToken.deviceInfo?.userAgent ?? deviceInfo?.userAgent ?? 'unknown',
      ip:
        deviceInfo?.ip && deviceInfo.ip !== 'unknown'
          ? deviceInfo.ip
          : (storedToken.deviceInfo?.ip ?? 'unknown'),
    };

    return this.issueSessionTokens(
      payload.userId,
      payload.email,
      storedToken.familyId,
      effectiveDeviceInfo,
    );
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

    if (
      user.authProviders?.includes('google') &&
      !user.authProviders?.includes('local')
    ) {
      await this.mailer.sendGoogleAccountPasswordResetNoticeEmail(
        user.email,
        user.fullName,
      );
      return;
    }

    // Delete any existing reset tokens for this user
    await this.resetTokenRepo.deleteAllByUserId(user.id);

    // Generate cryptographically secure random token (32 bytes = 64 hex characters)
    const { rawToken, tokenHash } = this.generateOpaqueToken();
    const expiresAt = new Date(
      Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * TIME_MS.MINUTE,
    );

    await this.resetTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.mailer.sendPasswordResetEmail(
      user.email,
      user.fullName,
      rawToken,
    );
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

    try {
      await this.mailer.sendPasswordResetSuccessEmail(
        user.email,
        user.fullName,
      );
    } catch (error) {
      logger.error(
        { error, userId: user.id, email: user.email },
        'Failed to send password reset success confirmation email',
      );
    }
  }
}

export const authService = new AuthService();
