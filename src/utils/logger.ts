import env from '@src/config/env.js';
import pino from 'pino';

const isProduction: boolean = env?.NODE_ENV === 'production';

const logger = pino({
  level: !isProduction ? 'debug' : 'info',
  ...(!isProduction && { transport: { target: 'pino-pretty' } }),
});

export default logger;
