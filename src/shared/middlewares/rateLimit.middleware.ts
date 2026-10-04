import { env } from '@src/config/env.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import { default as rateLimit } from 'express-rate-limit';

const MINUTE_IN_MS = 60 * 1000;

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * MINUTE_IN_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: `Too many requests from this IP, please try again after ${env.RATE_LIMIT_WINDOW_MINUTES} minutes.`,
  },
});

export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MINUTES * MINUTE_IN_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: `Too many auth requests from this IP, please try again after ${env.AUTH_RATE_LIMIT_WINDOW_MINUTES} minutes.`,
  },
});

export const refreshLimiter = rateLimit({
  windowMs: env.REFRESH_RATE_LIMIT_WINDOW_MINUTES * MINUTE_IN_MS,
  limit: env.REFRESH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: `Too many refresh requests from this IP, please try again after ${env.REFRESH_RATE_LIMIT_WINDOW_MINUTES} minutes.`,
  },
});
