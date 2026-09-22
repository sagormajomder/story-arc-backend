import { authService } from '@src/modules/auth/auth.service.js';
import type { RegisterDto } from '@src/modules/auth/auth.validate.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import sendResponse from '@src/shared/utils/sendResponse.js';
import type { Request, Response } from 'express';

export const registerUserCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const registerDto: RegisterDto = req.body;

    const result = await authService.register(registerDto);

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  },
);
