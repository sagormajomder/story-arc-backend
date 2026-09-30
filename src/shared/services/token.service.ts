import { env } from '@src/config/env.js';
import { AppError } from '@src/shared/errors/appError.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import { errors, jwtVerify, SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';

export interface ITokenPayload {
  userId: string;
  email: string;
  familyId?: string;
  jti?: string;
  [key: string]: unknown;
}

export interface ITokenService {
  generateAccessToken(
    payload: ITokenPayload,
    secret?: string,
    expiresIn?: string,
  ): Promise<string>;
  generateRefreshToken(
    payload: ITokenPayload,
    secret?: string,
    expiresIn?: string,
  ): Promise<string>;
  verifyAccessToken(token: string, secret?: string): Promise<ITokenPayload>;
  verifyRefreshToken(token: string, secret?: string): Promise<ITokenPayload>;
}

export class JoseTokenService implements ITokenService {
  constructor(
    private readonly defaultAccessSecret: string = env.JWT_ACCESS_SECRET,
    private readonly defaultRefreshSecret: string = env.JWT_REFRESH_SECRET,
    private readonly defaultAccessExpiresIn: string = env.JWT_ACCESS_EXPIRES_IN,
    private readonly defaultRefreshExpiresIn: string = env.JWT_REFRESH_EXPIRES_IN,
  ) {}

  private getEncodedSecret(secret: string): Uint8Array {
    return new TextEncoder().encode(secret);
  }

  private async signToken(
    payload: ITokenPayload,
    secret: string,
    expiresIn: string,
  ): Promise<string> {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(this.getEncodedSecret(secret));
  }

  private async verifyToken(
    token: string,
    secret: string,
  ): Promise<ITokenPayload> {
    try {
      const { payload } = await jwtVerify(
        token,
        this.getEncodedSecret(secret),
        {
          algorithms: ['HS256'],
        },
      );
      return payload as unknown as ITokenPayload;
    } catch (error) {
      if (error instanceof errors.JWTExpired) {
        throw new AppError('Token has expired', HTTP_STATUS.UNAUTHORIZED);
      }
      if (
        error instanceof errors.JWTInvalid ||
        error instanceof errors.JWSInvalid ||
        error instanceof errors.JWTClaimValidationFailed
      ) {
        throw new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED);
      }
      throw new AppError('Token verification failed', HTTP_STATUS.UNAUTHORIZED);
    }
  }

  async generateAccessToken(
    payload: ITokenPayload,
    secret: string = this.defaultAccessSecret,
    expiresIn: string = this.defaultAccessExpiresIn,
  ): Promise<string> {
    return this.signToken(payload, secret, expiresIn);
  }

  async generateRefreshToken(
    payload: ITokenPayload,
    secret: string = this.defaultRefreshSecret,
    expiresIn: string = this.defaultRefreshExpiresIn,
  ): Promise<string> {
    return this.signToken(payload, secret, expiresIn);
  }

  async verifyAccessToken(
    token: string,
    secret: string = this.defaultAccessSecret,
  ): Promise<ITokenPayload> {
    return this.verifyToken(token, secret);
  }

  async verifyRefreshToken(
    token: string,
    secret: string = this.defaultRefreshSecret,
  ): Promise<ITokenPayload> {
    return this.verifyToken(token, secret);
  }
}

export const tokenService = new JoseTokenService();
