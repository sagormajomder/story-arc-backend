import { env } from '@src/config/env.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import rateLimit, { MINUTE } from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * MINUTE,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: `Too many requests from this IP, please try again after ${env.RATE_LIMIT_WINDOW_MINUTES} minutes.`,
  },
});

export const refreshLimiter = rateLimit({
  windowMs: env.REFRESH_RATE_LIMIT_WINDOW_MINUTES * MINUTE,
  limit: env.REFRESH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: `Too many refresh requests from this IP, please try again after ${env.REFRESH_RATE_LIMIT_WINDOW_MINUTES} minutes.`,
  },
});

