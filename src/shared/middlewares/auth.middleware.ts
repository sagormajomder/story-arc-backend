import { AppError } from '@src/shared/errors/appError.js';
import { tokenService } from '@src/shared/services/token.service.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import {
  COOKIE_CONFIG,
  HTTP_STATUS,
  type UserRole,
} from '@src/shared/utils/constants.js';
import type { NextFunction, Request, Response } from 'express';

const extractAccessToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  if (req.cookies && req.cookies[COOKIE_CONFIG.ACCESS_TOKEN_NAME]) {
    return req.cookies[COOKIE_CONFIG.ACCESS_TOKEN_NAME];
  }

  return undefined;
};

export const authenticate = asyncCatch(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = extractAccessToken(req);

    if (!token) {
      throw new AppError(
        'Authentication required. Please log in.',
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const payload = await tokenService.verifyAccessToken(token);

    if (!payload.userId || !payload.email) {
      throw new AppError(
        'Invalid authentication token',
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  },
);

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          HTTP_STATUS.FORBIDDEN,
        ),
      );
    }

    next();
  };
};
