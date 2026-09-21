import pino from 'pino';

const isProduction: boolean = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: !isProduction ? 'debug' : 'info',
  ...(!isProduction && { transport: { target: 'pino-pretty' } }),
});
