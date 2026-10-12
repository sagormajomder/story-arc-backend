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

export const USER_EXCLUDED_FIELDS = [
  'password',
  'authProviders',
  'isEmailVerified',
  'googleId',
] as const;

export type UserExcludedField = (typeof USER_EXCLUDED_FIELDS)[number];

export type UserResponseDto = Omit<IUserPlainDBResponse, UserExcludedField>;

export interface ICreateGoogleUserInput {
  fullName: string;
  email: string;
  profileImage: string;
  googleId: string;
  role: UserRole;
}

export interface IUsersStats {
  totalUsers: number;
  activeUsers: number;
  adminRoles: number;
}

export interface IFindAllUsersOptions {
  page: number;
  limit: number;
  search?: string | undefined;
  role?: UserRole | undefined;
}

export interface IGetUsersResult {
  users: UserResponseDto[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  stats: IUsersStats;
}

export interface IUpdateProfileInput {
  fullName?: string | undefined;
  profileImage?: string | undefined;
}
