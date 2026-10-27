import { env } from '@src/config/env.js';
import pino from 'pino';

export const logger = pino({
  name: 'story-arc-api',
  level: env.isDevelopment ? 'debug' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      '*.*.password',
      'newPassword',
      '*.newPassword',
      '*.*.newPassword',
      'currentPassword',
      '*.currentPassword',
      'confirmPassword',
      '*.confirmPassword',
      'refreshToken',
      '*.refreshToken',
      'accessToken',
      '*.accessToken',
      'secret',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  ...(env.isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
});
