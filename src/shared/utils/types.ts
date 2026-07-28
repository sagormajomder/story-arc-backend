import type { NextFunction, Request, Response } from 'express';

export type asyncCatchFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;
