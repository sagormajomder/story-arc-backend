import { env } from '@src/config/env.js';
import rateLimit, { MINUTE } from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * MINUTE,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: `Too many requests from this IP, please try again after ${env.RATE_LIMIT_WINDOW_MINUTES} minutes.`,
  },
});
