import { User } from '@src/modules/user/user.model.js';
import type {
  IUser,
  IUserPlainDBResponse,
} from '@src/modules/user/user.types.js';
import { VALIDATIONS } from '@src/shared/utils/constants.js';

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
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  markEmailAsVerified(userId: string): Promise<void>;
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

  async findByGoogleId(
    googleId: string,
  ): Promise<IUserPlainDBResponse | null> {
    const userDoc = await this.model.findOne({ googleId }).exec();
    if (!userDoc) {
      return null;
    }
    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }

  async createGoogleUser(data: {
    fullName: string;
    email: string;
    profileImage: string;
    googleId: string;
  }): Promise<IUserPlainDBResponse> {
    const userDoc = await this.model.create({
      ...data,
      isEmailVerified: true,
      authProviders: ['google'],
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

  async updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
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
}

export const userRepository = new UserRepository();
