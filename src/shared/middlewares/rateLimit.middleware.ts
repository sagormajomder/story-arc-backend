import { env } from '@src/config/env.js';
import { HTTP_STATUS, TIME_MS } from '@src/shared/utils/constants.js';
import { default as rateLimit } from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * TIME_MS.MINUTE,
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
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MINUTES * TIME_MS.MINUTE,
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
  windowMs: env.REFRESH_RATE_LIMIT_WINDOW_MINUTES * TIME_MS.MINUTE,
  limit: env.REFRESH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: `Too many refresh requests from this IP, please try again after ${env.REFRESH_RATE_LIMIT_WINDOW_MINUTES} minutes.`,
  },
});

export const forgotPasswordEmailLimiter = rateLimit({
  windowMs:
    env.PASSWORD_RESET_EMAIL_RATE_LIMIT_WINDOW_MINUTES * TIME_MS.MINUTE,
  limit: env.PASSWORD_RESET_EMAIL_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: req => {
    const email = req.body?.email;
    return typeof email === 'string' && email.trim()
      ? `reset-email:${email.trim().toLowerCase()}`
      : 'anonymous';
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: `Too many password reset requests for this email. Please try again after ${env.PASSWORD_RESET_EMAIL_RATE_LIMIT_WINDOW_MINUTES} minutes.`,
  },
});

export const resendVerificationEmailLimiter = rateLimit({
  windowMs:
    env.RESEND_VERIFICATION_EMAIL_RATE_LIMIT_WINDOW_MINUTES * TIME_MS.MINUTE,
  limit: env.RESEND_VERIFICATION_EMAIL_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: req => {
    const email = req.body?.email;
    return typeof email === 'string' && email.trim()
      ? `verify-email:${email.trim().toLowerCase()}`
      : 'anonymous';
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: `Too many verification email requests for this address. Please try again after ${env.RESEND_VERIFICATION_EMAIL_RATE_LIMIT_WINDOW_MINUTES} minutes.`,
  },
});

