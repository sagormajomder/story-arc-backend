import { type UserResponseDto } from '@src/modules/user/user.index.js';

export interface IDeviceInfo {
  userAgent?: string;
  ip?: string;
}

export interface ICreateRefreshTokenInput {
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  deviceInfo?: IDeviceInfo;
  isRevoked?: boolean;
}

export interface IRefreshTokenPlainResponse {
  id: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  isRevoked: boolean;
  expiresAt: Date;
  deviceInfo?: IDeviceInfo;
  createdAt: Date;
  updatedAt: Date;
}

export type VerifyEmailResultDto = {
  message: string;
};

export type ResendVerificationResultDto = {
  message: string;
};

export type LoginResultDto = {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
};

export type TokensResultDto = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshResultDto = {
  accessToken: string;
};

export type ForgotPasswordResultDto = {
  message: string;
};

export type ResetPasswordResultDto = {
  message: string;
};
