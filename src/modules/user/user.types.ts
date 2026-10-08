export type AuthProviderType = 'local' | 'google';

export interface IUser {
  fullName: string;
  email: string;
  password?: string | undefined;
  profileImage: string;
  isEmailVerified: boolean;
  authProviders: AuthProviderType[];
  googleId?: string | undefined;
}

export interface IUserPlainDBResponse extends IUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserResponseDto = Omit<
  IUserPlainDBResponse,
  'password' | 'authProviders' | 'isEmailVerified' | 'googleId'
>;

