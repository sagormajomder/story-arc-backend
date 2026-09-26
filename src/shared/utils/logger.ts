import { env } from '@src/config/env.js';
import pino from 'pino';

export const logger = pino({
  level: env.isDevelopment ? 'debug' : 'info',
  ...(env.isDevelopment && { transport: { target: 'pino-pretty' } }),
});
