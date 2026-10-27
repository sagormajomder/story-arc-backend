import { env } from '@src/config/env.js';
import { SERVICE_NAME } from '@src/shared/utils/constants.js';
import pino from 'pino';

export const logger = pino({
  name: SERVICE_NAME,
  level: env.isDevelopment ? 'debug' : 'info',
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
      'authorization',
      'cookie',
      'password',
      '*.password',
      '*.*.password',
      '*.*.*.password',
      'newPassword',
      '*.newPassword',
      '*.*.newPassword',
      'currentPassword',
      '*.currentPassword',
      '*.*.currentPassword',
      'confirmPassword',
      '*.confirmPassword',
      '*.*.confirmPassword',
      'refreshToken',
      '*.refreshToken',
      '*.*.refreshToken',
      'accessToken',
      '*.accessToken',
      '*.*.accessToken',
      'secret',
      '*.secret',
      '*.*.secret',
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
