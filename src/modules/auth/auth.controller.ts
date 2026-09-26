import { env } from '@src/config/env.js';
import { authService } from '@src/modules/auth/auth.service.js';
import type { LoginDto, RegisterDto } from '@src/modules/auth/auth.validate.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { COOKIE_CONFIG, HTTP_STATUS } from '@src/shared/utils/constants.js';
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

export const loginUserCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const loginDto: LoginDto = req.body;

    const { user, accessToken, refreshToken } =
      await authService.login(loginDto);

    res.cookie(COOKIE_CONFIG.ACCESS_TOKEN_NAME, accessToken, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? 'none' : 'lax',
      maxAge: env.COOKIE_ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie(COOKIE_CONFIG.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? 'none' : 'lax',
      maxAge: env.COOKIE_REFRESH_TOKEN_MAX_AGE,
    });

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'User logged in successfully',
      data: {
        user,
        accessToken,
      },
    });
  },
);
