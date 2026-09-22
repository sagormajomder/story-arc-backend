import type { RegisterDto } from '@src/modules/auth/auth.validate.js';
import {
  userService,
  type IUserService,
  type UserResponseDto,
} from '@src/modules/user/user.index.js';
import { AppError } from '@src/shared/errors/appError.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';

export interface IAuthService {
  register(registerDto: RegisterDto): Promise<{ user: UserResponseDto }>;
}

class AuthService implements IAuthService {
  constructor(private readonly userSvc: IUserService = userService) {}

  async register(registerDto: RegisterDto): Promise<{ user: UserResponseDto }> {
    const existingUser = await this.userSvc.findByEmail(registerDto.email);
    if (existingUser) {
      throw new AppError(
        'User already exists with this email',
        HTTP_STATUS.CONFLICT,
      );
    }

    return this.userSvc.createUser(registerDto);
  }
}

export const authService = new AuthService();
