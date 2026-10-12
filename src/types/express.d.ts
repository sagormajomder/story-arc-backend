import type { IAuthUser } from '@src/shared/utils/types.ts';

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
