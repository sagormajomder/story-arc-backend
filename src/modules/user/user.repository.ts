import { User } from '@/src/modules/user/user.model.js';
import type {
  IUser,
  IUserPlainDBResponse,
} from '@/src/modules/user/user.types.js';

export interface IUserRepository {
  create(userData: IUser): Promise<IUserPlainDBResponse>;
}

class UserRepository implements IUserRepository {
  #model;
  constructor(userModel = User) {
    this.#model = userModel;
  }

  async create(userData: IUser): Promise<IUserPlainDBResponse> {
    const userDoc = await this.#model.create(userData);
    return userDoc.toObject() as unknown as IUserPlainDBResponse;
  }
}

export const userRepository = new UserRepository();
