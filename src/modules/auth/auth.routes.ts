import {
  forgotPasswordCntlr,
  googleLoginCntlr,
  loginUserCntlr,
  logoutUserCntlr,
  refreshTokenCntlr,
  registerUserCntlr,
  resendVerificationCntlr,
  resetPasswordCntlr,
  verifyEmailCntlr,
} from '@src/modules/auth/auth.controller.js';
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@src/modules/auth/auth.validate.js';
import {
  authLimiter,
  forgotPasswordEmailLimiter,
  refreshLimiter,
  resendVerificationEmailLimiter,
} from '@src/shared/middlewares/rateLimit.middleware.js';
import { csrfGuard } from '@src/shared/middlewares/security.middleware.js';
import { validate } from '@src/shared/middlewares/validate.middleware.js';
import express from 'express';
const authRoutes = express.Router();

authRoutes.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  registerUserCntlr,
);
authRoutes.post(
  '/verify-email',
  authLimiter,
  validate(verifyEmailSchema),
  verifyEmailCntlr,
);
authRoutes.post(
  '/resend-verification',
  authLimiter,
  validate(resendVerificationSchema),
  resendVerificationEmailLimiter,
  resendVerificationCntlr,
);
authRoutes.post('/login', authLimiter, validate(loginSchema), loginUserCntlr);
authRoutes.post(
  '/google',
  authLimiter,
  validate(googleLoginSchema),
  googleLoginCntlr,
);
authRoutes.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordEmailLimiter,
  forgotPasswordCntlr,
);
authRoutes.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  resetPasswordCntlr,
);
authRoutes.post('/refresh', csrfGuard, refreshLimiter, refreshTokenCntlr);
authRoutes.post('/logout', csrfGuard, logoutUserCntlr);

export default authRoutes;

