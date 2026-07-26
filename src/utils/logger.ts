import pino from 'pino';

const isProduction: boolean = process.env.NODE_ENV === 'production';

const logger = pino({
  level: !isProduction ? 'debug' : 'info',
  ...(!isProduction && { transport: { target: 'pino-pretty' } }),
});

export default logger;
