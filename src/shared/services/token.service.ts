import { env } from '@src/config/env.js';
import jwt, { type SignOptions } from 'jsonwebtoken';

export interface ITokenPayload {
  userId: string;
  email: string;
  [key: string]: unknown;
}

export interface ITokenService {
  generateAccessToken(
    payload: ITokenPayload,
    secret?: string,
    options?: SignOptions,
  ): string;
  generateRefreshToken(
    payload: ITokenPayload,
    secret?: string,
    options?: SignOptions,
  ): string;
  verifyAccessToken(token: string, secret?: string): ITokenPayload;
  verifyRefreshToken(token: string, secret?: string): ITokenPayload;
}

export class JwtTokenService implements ITokenService {
  constructor(
    private readonly defaultAccessSecret: string = env.JWT_ACCESS_SECRET,
    private readonly defaultRefreshSecret: string = env.JWT_REFRESH_SECRET,
    private readonly defaultAccessExpiresIn: string = env.JWT_ACCESS_EXPIRES_IN,
    private readonly defaultRefreshExpiresIn: string = env.JWT_REFRESH_EXPIRES_IN,
  ) {}

  generateAccessToken(
    payload: ITokenPayload,
    secret: string = this.defaultAccessSecret,
    options?: SignOptions,
  ): string {
    const signOptions: SignOptions = {
      ...(options ?? {}),
      expiresIn: (options?.expiresIn ??
        this.defaultAccessExpiresIn) as NonNullable<SignOptions['expiresIn']>,
    };
    return jwt.sign(payload, secret, signOptions);
  }

  generateRefreshToken(
    payload: ITokenPayload,
    secret: string = this.defaultRefreshSecret,
    options?: SignOptions,
  ): string {
    const signOptions: SignOptions = {
      ...(options ?? {}),
      expiresIn: (options?.expiresIn ??
        this.defaultRefreshExpiresIn) as NonNullable<SignOptions['expiresIn']>,
    };
    return jwt.sign(payload, secret, signOptions);
  }

  verifyAccessToken(
    token: string,
    secret: string = this.defaultAccessSecret,
  ): ITokenPayload {
    return jwt.verify(token, secret) as ITokenPayload;
  }

  verifyRefreshToken(
    token: string,
    secret: string = this.defaultRefreshSecret,
  ): ITokenPayload {
    return jwt.verify(token, secret) as ITokenPayload;
  }
}

export const tokenService = new JwtTokenService();
