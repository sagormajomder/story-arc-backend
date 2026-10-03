import {
  loginUserCntlr,
  logoutUserCntlr,
  refreshTokenCntlr,
  registerUserCntlr,
} from '@src/modules/auth/auth.controller.js';
import {
  loginSchema,
  registerSchema,
} from '@src/modules/auth/auth.validate.js';
import {
  authLimiter,
  refreshLimiter,
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
authRoutes.post('/login', authLimiter, validate(loginSchema), loginUserCntlr);
authRoutes.post('/refresh', csrfGuard, refreshLimiter, refreshTokenCntlr);
authRoutes.post('/logout', csrfGuard, logoutUserCntlr);

export default authRoutes;
