import { logger } from '@/src/shared/utils/logger.js';
import type { asyncCatchFn } from '@/src/shared/utils/types.js';
import type { NextFunction, Request, Response } from 'express';

function asyncCatch(fn: asyncCatchFn): asyncCatchFn {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await fn(req, res, next);
    } catch (error) {
      logger.error({ error });
      next(error);
    }
  };
}

export default asyncCatch;
