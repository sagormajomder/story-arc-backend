import { env } from '@src/config/env.js';
import { authService } from '@src/modules/auth/auth.service.js';
import type { IDeviceInfo } from '@src/modules/auth/auth.types.js';
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '@src/modules/auth/auth.validate.js';
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

    await authService.register(registerDto);

    sendResponse(res, {
      statusCode: HTTP_STATUS.ACCEPTED,
      success: true,
      message:
        'We have sent a verification link to your email address. Please check your inbox.',
      data: null,
    });
  },
);

export const verifyEmailCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const verifyEmailDto: VerifyEmailDto = req.body;

    await authService.verifyEmail(verifyEmailDto);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Email verified successfully. Please log in.',
      data: null,
    });
  },
);

export const resendVerificationCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const resendVerificationDto: ResendVerificationDto = req.body;

    await authService.resendVerification(resendVerificationDto);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message:
        'If an unverified account exists with that email, a verification link has been sent.',
      data: null,
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

    // res.cookie(
    //   COOKIE_CONFIG.ACCESS_TOKEN_NAME,
    //   accessToken,
    //   getCookieOptions(env.COOKIE_ACCESS_TOKEN_MAX_AGE),
    // );

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

      // res.cookie(
      //   COOKIE_CONFIG.ACCESS_TOKEN_NAME,
      //   accessToken,
      //   getCookieOptions(env.COOKIE_ACCESS_TOKEN_MAX_AGE),
      // );

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

    // res.clearCookie(COOKIE_CONFIG.ACCESS_TOKEN_NAME, getClearCookieOptions());
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

export const forgotPasswordCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const forgotPasswordDto: ForgotPasswordDto = req.body;

    await authService.forgotPassword(forgotPasswordDto);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent.',
      data: null,
    });
  },
);

export const resetPasswordCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const resetPasswordDto: ResetPasswordDto = req.body;

    await authService.resetPassword(resetPasswordDto);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message:
        'Password has been reset successfully. Please log in with your new password.',
      data: null,
    });
  },
);

