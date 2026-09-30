import { env } from '@src/config/env.js';
import { authService } from '@src/modules/auth/auth.service.js';
import type { IDeviceInfo } from '@src/modules/auth/auth.types.js';
import type { LoginDto, RegisterDto } from '@src/modules/auth/auth.validate.js';
import { AppError } from '@src/shared/errors/appError.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { COOKIE_CONFIG, HTTP_STATUS } from '@src/shared/utils/constants.js';
import sendResponse from '@src/shared/utils/sendResponse.js';
import type { Request, Response } from 'express';

const getCookieOptions = (maxAge: number, path = '/') => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ('none' as const) : ('lax' as const),
  maxAge,
  path,
});

const getClearCookieOptions = (path = '/') => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ('none' as const) : ('lax' as const),
  path,
});

const extractDeviceInfo = (req: Request): IDeviceInfo => {
  const deviceInfo: IDeviceInfo = {};
  const userAgent = req.headers['user-agent'];
  const ip = req.ip || req.socket.remoteAddress;

  if (userAgent) {
    deviceInfo.userAgent = userAgent;
  }
  if (ip) {
    deviceInfo.ip = ip;
  }

  return deviceInfo;
};

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
    const deviceInfo = extractDeviceInfo(req);

    const { user, accessToken, refreshToken } = await authService.login(
      loginDto,
      deviceInfo,
    );

    res.cookie(
      COOKIE_CONFIG.ACCESS_TOKEN_NAME,
      accessToken,
      getCookieOptions(env.COOKIE_ACCESS_TOKEN_MAX_AGE),
    );

    res.cookie(
      COOKIE_CONFIG.REFRESH_TOKEN_NAME,
      refreshToken,
      getCookieOptions(
        env.COOKIE_REFRESH_TOKEN_MAX_AGE,
        COOKIE_CONFIG.REFRESH_COOKIE_PATH,
      ),
    );

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

export const refreshTokenCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const oldRefreshToken = req.cookies?.[COOKIE_CONFIG.REFRESH_TOKEN_NAME];
    if (typeof oldRefreshToken !== 'string' || !oldRefreshToken) {
      throw new AppError('Refresh token not found', HTTP_STATUS.UNAUTHORIZED);
    }

    const deviceInfo = extractDeviceInfo(req);
    try {
      const { accessToken, refreshToken } = await authService.refreshTokens(
        oldRefreshToken,
        deviceInfo,
      );

      res.cookie(
        COOKIE_CONFIG.ACCESS_TOKEN_NAME,
        accessToken,
        getCookieOptions(env.COOKIE_ACCESS_TOKEN_MAX_AGE),
      );

      res.cookie(
        COOKIE_CONFIG.REFRESH_TOKEN_NAME,
        refreshToken,
        getCookieOptions(
          env.COOKIE_REFRESH_TOKEN_MAX_AGE,
          COOKIE_CONFIG.REFRESH_COOKIE_PATH,
        ),
      );

      sendResponse(res, {
        statusCode: HTTP_STATUS.OK,
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          accessToken,
        },
      });
    } catch (error) {
      res.clearCookie(COOKIE_CONFIG.ACCESS_TOKEN_NAME, getClearCookieOptions());
      res.clearCookie(
        COOKIE_CONFIG.REFRESH_TOKEN_NAME,
        getClearCookieOptions(COOKIE_CONFIG.REFRESH_COOKIE_PATH),
      );
      throw error;
    }
  },
);

export const logoutUserCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[COOKIE_CONFIG.REFRESH_TOKEN_NAME];
    if (typeof refreshToken === 'string' && refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie(COOKIE_CONFIG.ACCESS_TOKEN_NAME, getClearCookieOptions());
    res.clearCookie(
      COOKIE_CONFIG.REFRESH_TOKEN_NAME,
      getClearCookieOptions(COOKIE_CONFIG.REFRESH_COOKIE_PATH),
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'User logged out successfully',
      data: null,
    });
  },
);
