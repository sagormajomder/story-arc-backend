import { env } from '@src/config/env.js';
import { AppError } from '@src/shared/errors/appError.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import type { NextFunction, Request, Response } from 'express';

const ALLOWED_ORIGINS = new Set(env.CLIENT_URLS);

export const csrfGuard = (req: Request, _res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const origin = req.get('origin');
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    throw new AppError('Forbidden origin', HTTP_STATUS.FORBIDDEN);
  }

  if (req.get('x-requested-with') !== 'fetch') {
    throw new AppError('Missing required header', HTTP_STATUS.FORBIDDEN);
  }

  next();
};
