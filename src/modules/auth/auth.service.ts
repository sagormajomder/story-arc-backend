import type {
  LoginResultDto,
  RegisterResultDto,
} from '@src/modules/auth/auth.types.js';
import type { LoginDto, RegisterDto } from '@src/modules/auth/auth.validate.js';
import {
  userService,
  type IUserService,
} from '@src/modules/user/user.index.js';
import { AppError } from '@src/shared/errors/appError.js';
import {
  argon2PasswordHasher,
  type IPasswordHasher,
} from '@src/shared/services/hasher.service.js';
import {
  tokenService,
  type ITokenService,
} from '@src/shared/services/token.service.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';

export interface IAuthService {
  register(registerDto: RegisterDto): Promise<RegisterResultDto>;
  login(loginDto: LoginDto): Promise<LoginResultDto>;
}

export class AuthService implements IAuthService {
  constructor(
    private readonly userSvc: IUserService = userService,
    private readonly passwordHasher: IPasswordHasher = argon2PasswordHasher,
    private readonly tokenSvc: ITokenService = tokenService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResultDto> {
    const existingUser = await this.userSvc.findByEmail(registerDto.email);
    if (existingUser) {
      throw new AppError(
        'Unable to complete registration. Please check your details or try logging in.',
        HTTP_STATUS.CONFLICT,
      );
    }

    return this.userSvc.createUser(registerDto);
  }

  async login(loginDto: LoginDto): Promise<LoginResultDto> {
    const existingUser = await this.userSvc.findByEmail(loginDto.email, true);

    const isPasswordMatched = await this.passwordHasher.compare(
      loginDto.password,
      existingUser?.password,
    );

    if (!existingUser || !isPasswordMatched) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    const tokenPayload = {
      userId: existingUser.id,
      email: existingUser.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenSvc.generateAccessToken(tokenPayload),
      this.tokenSvc.generateRefreshToken(tokenPayload),
    ]);

    const userWithoutPassword = excludeFields(existingUser, ['password']);

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();
