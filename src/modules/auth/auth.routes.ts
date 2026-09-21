import { registerUserCntlr } from '@src/modules/auth/auth.controller.js';
import { registerSchema } from '@src/modules/auth/auth.validate.js';
import validate from '@src/shared/middlewares/validate.middleware.js';
import express from 'express';
const authRoutes = express.Router();

authRoutes.post('/register', validate(registerSchema), registerUserCntlr);

export default authRoutes;
