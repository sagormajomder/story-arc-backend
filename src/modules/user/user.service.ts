import {
  userRepository,
  type IUserRepository,
} from '@src/modules/user/user.repository.js';
import type {
  ICreateGoogleUserInput,
  IGetUsersResult,
  IUser,
  IUserPlainDBResponse,
  UserResponseDto,
} from '@src/modules/user/user.types.js';
import type {
  GetUsersQueryDto,
  UpdateProfileDto,
} from '@src/modules/user/user.validate.js';
import { AppError } from '@src/shared/errors/appError.js';
import {
  argon2PasswordHasher,
  type IPasswordHasher,
} from '@src/shared/services/hasher.service.js';
import {
  HTTP_STATUS,
  USER_ROLES,
  type UserRole,
} from '@src/shared/utils/constants.js';
import { toUserResponseDto } from '@src/modules/user/user.mapper.js';

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
  createGoogleUser(
    data: ICreateGoogleUserInput,
  ): Promise<IUserPlainDBResponse>;
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
  getAllUsers(query: GetUsersQueryDto): Promise<IGetUsersResult>;
  getProfile(userId: string): Promise<UserResponseDto>;
  updateProfile(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<UserResponseDto>;
  updateUserRole(userId: string, role: UserRole): Promise<UserResponseDto>;
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
      role: userData.role ?? USER_ROLES.USER,
      password: hashedPassword,
    });

    return {
      user: toUserResponseDto(user),
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

  async createGoogleUser(
    data: ICreateGoogleUserInput,
  ): Promise<IUserPlainDBResponse> {
    return this.repo.createGoogleUser({
      ...data,
      role: data.role ?? USER_ROLES.USER,
    });
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

  async getAllUsers(query: GetUsersQueryDto): Promise<IGetUsersResult> {
    const { users, total, stats } = await this.repo.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role,
    });

    const sanitizedUsers = users.map(toUserResponseDto);

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      users: sanitizedUsers,
      total,
      totalPages,
      page: query.page,
      limit: query.limit,
      stats,
    };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return toUserResponseDto(user);
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.repo.updateProfile(userId, data);
    if (!updatedUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return toUserResponseDto(updatedUser);
  }

  async updateUserRole(
    userId: string,
    role: UserRole,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.repo.updateRole(userId, role);
    if (!updatedUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return toUserResponseDto(updatedUser);
  }
}

export const userService = new UserService();
