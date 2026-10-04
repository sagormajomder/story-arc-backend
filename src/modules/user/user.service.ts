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
  updatePassword(userId: string, newPassword: string): Promise<void>;
}

export class UserService implements IUserService {
  constructor(
    private readonly repo: IUserRepository = userRepository,
    private readonly passwordHasher: IPasswordHasher = argon2PasswordHasher,
  ) {}

  async createUser(userData: IUser): Promise<{ user: UserResponseDto }> {
    const hashedPassword = await this.passwordHasher.hash(userData.password);
    const user = await this.repo.create({
      ...userData,
      password: hashedPassword,
    });
    const userWithoutPassword = excludeFields(user, ['password']);
    return {
      user: userWithoutPassword,
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

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.passwordHasher.hash(newPassword);
    await this.repo.updatePassword(userId, hashedPassword);
  }
}

export const userService = new UserService();
