import type { IResponse } from '@src/shared/utils/types.js';
import type { Response } from 'express';

export function sendResponse<T>(res: Response, data: IResponse<T>): void {
  const responsePayload: {
    success: boolean;
    message?: string;
    meta?: IResponse<T>['meta'];
    data?: T;
  } = {
    success: data.success,
  };

  if (data.message !== undefined) {
    responsePayload.message = data.message;
  }

  if (data.meta !== undefined) {
    responsePayload.meta = data.meta;
  }

  if (data.data !== undefined) {
    responsePayload.data = data.data;
  }

  res.status(data.statusCode).json(responsePayload);
}

export default sendResponse;
