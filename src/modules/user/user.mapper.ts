import type {
  IUserPlainDBResponse,
  UserResponseDto,
} from '@src/modules/user/user.types.js';
import { USER_EXCLUDED_FIELDS } from '@src/modules/user/user.types.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';

export const toUserResponseDto = (
  user: IUserPlainDBResponse,
): UserResponseDto => {
  return excludeFields(user, USER_EXCLUDED_FIELDS);
};
