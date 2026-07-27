import rateLimit, { MINUTE } from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many requests from this IP, please try again after 15 minutes.',
  },
});
