import { env } from '@src/config/env.js';
import type {
  ICreateRefreshTokenInput,
  IDeviceInfo,
  LoginResultDto,
  RegisterResultDto,
  TokensResultDto,
} from '@src/modules/auth/auth.types.js';
import type { LoginDto, RegisterDto } from '@src/modules/auth/auth.validate.js';
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
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';
import { logger } from '@src/shared/utils/logger.js';
import { randomUUID } from 'node:crypto';

export interface IAuthService {
  register(registerDto: RegisterDto): Promise<RegisterResultDto>;
  login(loginDto: LoginDto, deviceInfo?: IDeviceInfo): Promise<LoginResultDto>;
  refreshTokens(
    refreshToken: string,
    deviceInfo?: IDeviceInfo,
  ): Promise<TokensResultDto>;
  logout(refreshToken: string): Promise<void>;
}

export class AuthService implements IAuthService {
  constructor(
    private readonly userSvc: IUserService = userService,
    private readonly passwordHasher: IPasswordHasher = argon2PasswordHasher,
    private readonly tokenSvc: ITokenService = tokenService,
    private readonly tokenHasher: ITokenHasher = sha256TokenHasher,
    private readonly refreshTokenRepo: IRefreshTokenRepository = refreshTokenRepository,
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
}

export const authService = new AuthService();
