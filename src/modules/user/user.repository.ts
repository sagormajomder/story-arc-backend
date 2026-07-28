import { User } from '@src/modules/user/user.model.js';
import type { IUser, IUserPlain } from '@src/modules/user/user.types.js';
import { toPlainObject } from '@src/shared/utils/toPlainObject.js';

export interface IUserRepository {
  create(userData: IUser): Promise<IUserPlain>;
}

class UserRepository implements IUserRepository {
  #model;
  constructor(userModel = User) {
    this.#model = userModel;
  }

  async create(userData: IUser): Promise<IUserPlain> {
    const userDoc = await this.#model.create(userData);
    return toPlainObject<IUserPlain>(userDoc);
  }
}

export const userRepository = new UserRepository();
