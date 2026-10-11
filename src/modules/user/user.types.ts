import type { UserRole } from '@src/shared/utils/constants.js';

export type AuthProviderType = 'local' | 'google';

export interface IUser {
  fullName: string;
  email: string;
  password?: string | undefined;
  profileImage: string;
  isEmailVerified: boolean;
  authProviders: AuthProviderType[];
  googleId?: string | undefined;
  role: UserRole;
}

export interface IUserPlainDBResponse extends IUser {
  id: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserResponseDto = Omit<
  IUserPlainDBResponse,
  'password' | 'authProviders' | 'isEmailVerified' | 'googleId'
>;

export interface ICreateGoogleUserInput {
  fullName: string;
  email: string;
  profileImage: string;
  googleId: string;
  role: UserRole;
}
