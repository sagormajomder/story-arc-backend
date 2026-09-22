import { User } from '@src/modules/user/user.model.js';
import type {
  IUser,
  IUserPlainDBResponse,
} from '@src/modules/user/user.types.js';

export interface IUserRepository {
  create(userData: IUser): Promise<IUserPlainDBResponse>;
  findByEmail(
    email: string,
    includePassword?: boolean,
  ): Promise<IUserPlainDBResponse | null>;
}

class UserRepository implements IUserRepository {
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
}

export const userRepository = new UserRepository();
