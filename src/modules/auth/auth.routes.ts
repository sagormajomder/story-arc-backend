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
import { validate } from '@src/shared/middlewares/validate.middleware.js';
import express from 'express';
const authRoutes = express.Router();

authRoutes.post('/register', validate(registerSchema), registerUserCntlr);
authRoutes.post('/login', validate(loginSchema), loginUserCntlr);
authRoutes.post('/refresh', refreshTokenCntlr);
authRoutes.post('/logout', logoutUserCntlr);

export default authRoutes;
