import {
  userRepository,
  type IUserRepository,
} from '@src/modules/user/user.repository.js';
import type {
  IUser,
  IUserPlainDBResponse,
  UserResponseDto,
} from '@src/modules/user/user.types.js';
import {
  argon2PasswordHasher,
  type IPasswordHasher,
} from '@src/shared/services/hasher.service.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';

export interface IUserService {
  createUser(userData: IUser): Promise<{ user: UserResponseDto }>;
  findByEmail(
    email: string,
    includePassword?: boolean,
  ): Promise<IUserPlainDBResponse | null>;
  findById(
    userId: string,
    includePassword?: boolean,
  ): Promise<IUserPlainDBResponse | null>;
  findByGoogleId(googleId: string): Promise<IUserPlainDBResponse | null>;
  createGoogleUser(data: {
    fullName: string;
    email: string;
    profileImage: string;
    googleId: string;
  }): Promise<IUserPlainDBResponse>;
  linkGoogleAccount(
    userId: string,
    googleId: string,
    profileImage?: string,
  ): Promise<IUserPlainDBResponse>;
  claimAccountAsGoogle(
    userId: string,
    googleId: string,
    profileImage?: string,
  ): Promise<IUserPlainDBResponse>;
  updatePassword(userId: string, newPassword: string): Promise<void>;
  markEmailAsVerified(userId: string): Promise<void>;
}

export class UserService implements IUserService {
  constructor(
    private readonly repo: IUserRepository = userRepository,
    private readonly passwordHasher: IPasswordHasher = argon2PasswordHasher,
  ) {}

  async createUser(userData: IUser): Promise<{ user: UserResponseDto }> {
    const hashedPassword = await this.passwordHasher.hash(userData.password!);
    const user = await this.repo.create({
      ...userData,
      password: hashedPassword,
    });

    return {
      user: excludeFields(user, [
        'password',
        'authProviders',
        'isEmailVerified',
        'googleId',
      ]),
    };
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<IUserPlainDBResponse | null> {
    return this.repo.findByEmail(email, includePassword);
  }

  async findById(
    userId: string,
    includePassword = false,
  ): Promise<IUserPlainDBResponse | null> {
    return this.repo.findById(userId, includePassword);
  }

  async findByGoogleId(googleId: string): Promise<IUserPlainDBResponse | null> {
    return this.repo.findByGoogleId(googleId);
  }

  async createGoogleUser(data: {
    fullName: string;
    email: string;
    profileImage: string;
    googleId: string;
  }): Promise<IUserPlainDBResponse> {
    return this.repo.createGoogleUser(data);
  }

  async linkGoogleAccount(
    userId: string,
    googleId: string,
    profileImage?: string,
  ): Promise<IUserPlainDBResponse> {
    return this.repo.linkGoogleAccount(userId, googleId, profileImage);
  }

  async claimAccountAsGoogle(
    userId: string,
    googleId: string,
    profileImage?: string,
  ): Promise<IUserPlainDBResponse> {
    return this.repo.claimAccountAsGoogle(userId, googleId, profileImage);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.passwordHasher.hash(newPassword);
    await this.repo.updatePassword(userId, hashedPassword);
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await this.repo.markEmailAsVerified(userId);
  }
}

export const userService = new UserService();
