import {
  type IUserRepository,
  userRepository,
} from '@/src/modules/user/user.repository.js';
import type { IUser, IUserResponse } from '@/src/modules/user/user.types.js';
import { excludeFields } from '@/src/shared/utils/excludeFields.js';

class UserService {
  #repo: IUserRepository;
  constructor(userRepo: IUserRepository = userRepository) {
    this.#repo = userRepo;
  }

  async registerUser(userData: IUser): Promise<{ user: IUserResponse }> {
    const user = await this.#repo.create(userData);
    const userWithoutPassword = excludeFields(user, ['password']);
    return {
      user: userWithoutPassword,
    };
  }
}

export const userService = new UserService();
