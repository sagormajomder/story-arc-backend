import type { NextFunction, Request, Response } from 'express';

export type asyncCatchFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export interface IPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: IPaginationMeta;
  data?: T;
}

export interface IErrorSource {
  path: string | number;
  message: string;
}
