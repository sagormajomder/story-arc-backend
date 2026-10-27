import { AppError } from '@src/shared/errors/appError.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import type { NextFunction, Request, Response } from 'express';

export const requestTimeout = (timeoutMs: number) => {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        next(
          new AppError(
            `Request timeout: Operation exceeded ${timeoutMs}ms limit`,
            HTTP_STATUS.GATEWAY_TIMEOUT,
          ),
        );
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};
