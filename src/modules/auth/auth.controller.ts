import type { RegisterUserDto } from '@src/modules/auth/auth.validate.js';
import { userService } from '@src/modules/user/user.index.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import type { Request, Response } from 'express';

export const registerUserCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const userData: RegisterUserDto = req.body;

    const result = await userService.registerUser(userData);

    res.status(201).json({
      message: 'User registered successfully',
      data: result,
    });
  },
);
