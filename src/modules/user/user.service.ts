import {
  userRepository,
  type IUserRepository,
} from '@src/modules/user/user.repository.js';
import type { IUser, UserResponseDto } from '@src/modules/user/user.types.js';
import {
  bcryptPasswordHasher,
  type IPasswordHasher,
} from '@src/shared/services/hasher.service.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';

class UserService {
  constructor(
    private readonly repo: IUserRepository = userRepository,
    private readonly passwordHasher: IPasswordHasher = bcryptPasswordHasher,
  ) {}

  async registerUser(userData: IUser): Promise<{ user: UserResponseDto }> {
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
}

export const userService = new UserService();
