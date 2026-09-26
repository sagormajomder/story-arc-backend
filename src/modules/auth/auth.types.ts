import { type UserResponseDto } from '@src/modules/user/user.index.js';

export type RegisterResultDto = {
  user: UserResponseDto;
};

export type LoginResultDto = {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
};
