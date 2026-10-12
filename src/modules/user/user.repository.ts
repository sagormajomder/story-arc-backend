import { User } from '@src/modules/user/user.model.js';
import type {
  ICreateGoogleUserInput,
  IFindAllUsersOptions,
  IUpdateProfileInput,
  IUser,
  IUserPlainDBResponse,
  IUsersStats,
} from '@src/modules/user/user.types.js';
import {
  USER_ROLES,
  type UserRole,
  VALIDATIONS,
} from '@src/shared/utils/constants.js';

export interface IUserRepository {
  create(userData: IUser): Promise<IUserPlainDBResponse>;
  findByEmail(
    email: string,
    includePassword?: boolean,
  ): Promise<IUserPlainDBResponse | null>;
  findById(
    userId: string,
    includePassword?: boolean,
  ): Promise<IUserPlainDBResponse | null>;
  findByGoogleId(googleId: string): Promise<IUserPlainDBResponse | null>;
  createGoogleUser(data: ICreateGoogleUserInput): Promise<IUserPlainDBResponse>;
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
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  markEmailAsVerified(userId: string): Promise<void>;
  findAll(options: IFindAllUsersOptions): Promise<{
    users: IUserPlainDBResponse[];
    total: number;
    stats: IUsersStats;
  }>;
  updateRole(
    userId: string,
    role: UserRole,
  ): Promise<IUserPlainDBResponse | null>;
  updateProfile(
    userId: string,
    data: IUpdateProfileInput,
  ): Promise<IUserPlainDBResponse | null>;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly model = User) {}

  async create(userData: IUser): Promise<IUserPlainDBResponse> {
    const userDoc = await this.model.create(userData);
    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<IUserPlainDBResponse | null> {
    const query = this.model.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    const userDoc = await query.exec();
    if (!userDoc) {
      return null;
    }
    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }

  async findById(
    userId: string,
    includePassword = false,
  ): Promise<IUserPlainDBResponse | null> {
    const query = this.model.findById(userId);
    if (includePassword) {
      query.select('+password');
    }
    const userDoc = await query.exec();
    if (!userDoc) {
      return null;
    }
    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }

  async findByGoogleId(googleId: string): Promise<IUserPlainDBResponse | null> {
    const userDoc = await this.model.findOne({ googleId }).exec();
    if (!userDoc) {
      return null;
    }
    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }

  async createGoogleUser(
    data: ICreateGoogleUserInput,
  ): Promise<IUserPlainDBResponse> {
    const userDoc = await this.model.create({
      ...data,
      isEmailVerified: true,
      authProviders: ['google'],
      role: data.role ?? USER_ROLES.USER,
    });
    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }

  async linkGoogleAccount(
    userId: string,
    googleId: string,
    profileImage?: string,
  ): Promise<IUserPlainDBResponse> {
    const userDoc = await this.model.findById(userId);
    if (!userDoc) {
      throw new Error(`User not found with id ${userId}`);
    }

    userDoc.googleId = googleId;
    if (!userDoc.authProviders.includes('google')) {
      userDoc.authProviders.push('google');
    }
    userDoc.isEmailVerified = true;

    if (
      profileImage &&
      (userDoc.profileImage === VALIDATIONS.DEFAULT_PROFILE_IMAGE ||
        !userDoc.profileImage)
    ) {
      userDoc.profileImage = profileImage;
    }

    await userDoc.save();
    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }

  async claimAccountAsGoogle(
    userId: string,
    googleId: string,
    profileImage?: string,
  ): Promise<IUserPlainDBResponse> {
    const userDoc = await this.model.findById(userId);
    if (!userDoc) {
      throw new Error(`User not found with id ${userId}`);
    }

    userDoc.password = undefined;
    userDoc.googleId = googleId;
    userDoc.authProviders = ['google'];
    userDoc.isEmailVerified = true;

    if (profileImage) {
      userDoc.profileImage = profileImage;
    }

    await userDoc.save();
    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } },
    );
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      { $set: { isEmailVerified: true } },
    );
  }

  async findAll(options: IFindAllUsersOptions): Promise<{
    users: IUserPlainDBResponse[];
    total: number;
    stats: IUsersStats;
  }> {
    const filter: Record<string, unknown> = {};

    if (options.role) {
      filter.role = options.role;
    }

    if (options.search) {
      filter.$or = [
        { fullName: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
      ];
    }

    const skip = (options.page - 1) * options.limit;

    const [userDocs, total, totalUsers, adminRoles] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
      this.model.countDocuments().exec(),
      this.model.countDocuments({ role: USER_ROLES.ADMIN }).exec(),
    ]);

    const users = userDocs.map(
      doc => doc.toObject() as unknown as IUserPlainDBResponse,
    );

    return {
      users,
      total,
      stats: {
        totalUsers,
        activeUsers: totalUsers,
        adminRoles,
      },
    };
  }

  async updateRole(
    userId: string,
    role: UserRole,
  ): Promise<IUserPlainDBResponse | null> {
    const userDoc = await this.model
      .findByIdAndUpdate(
        userId,
        { $set: { role } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!userDoc) {
      return null;
    }

    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }

  async updateProfile(
    userId: string,
    data: IUpdateProfileInput,
  ): Promise<IUserPlainDBResponse | null> {
    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) {
      updateData.fullName = data.fullName;
    }
    if (data.profileImage !== undefined) {
      updateData.profileImage = data.profileImage;
    }

    const userDoc = await this.model
      .findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .exec();

    if (!userDoc) {
      return null;
    }

    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }
}

export const userRepository = new UserRepository();
