import { AppError } from '@src/shared/errors/appError.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import { logger } from '@src/shared/utils/logger.js';
import type { IErrorSource } from '@src/shared/utils/types.js';
import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

interface MongoDuplicateKeyError {
  code: number;
  keyValue?: Record<string, unknown>;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  logger.error({ err }, 'Error caught in global error handler');

  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = 'Internal server error';
  let errorSources: IErrorSource[] = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  } else if (err instanceof ZodError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation failed';
    errorSources = err.issues.map(iss => ({
      path: iss.path.join('.'),
      message: iss.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Invalid ${err.path}`;
    errorSources = [
      {
        path: err.path,
        message: `Invalid ${err.path}: ${err.value}`,
      },
    ];
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation error';
    errorSources = Object.values(err.errors).map(val => ({
      path: val.path,
      message: val.message,
    }));
  } else if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as MongoDuplicateKeyError).code === 11000
  ) {
    const duplicateKeyError = err as MongoDuplicateKeyError;
    const field =
      (duplicateKeyError.keyValue &&
        Object.keys(duplicateKeyError.keyValue)[0]) ||
      'field';
    statusCode = HTTP_STATUS.CONFLICT;
    message = `${field} already exists`;
    errorSources = [
      {
        path: field,
        message: `${field} already exists`,
      },
    ];
  } else if (err instanceof Error) {
    message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    errorSources = [
      {
        path: '',
        message,
      },
    ];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err instanceof Error ? err.stack : undefined,
    }),
  });
}
