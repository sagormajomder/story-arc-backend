import type { Request, Response } from 'express';
export function registerUserCntlr(_req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'User Registration successful',
  });
}
