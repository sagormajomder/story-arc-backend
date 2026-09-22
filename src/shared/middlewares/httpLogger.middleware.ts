import { logger } from '@src/shared/utils/logger.js';
import { pinoHttp } from 'pino-http';

export const pinoHttpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: req => req.url === '/api/v1/health',
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: req => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
    }),
    res: res => ({
      statusCode: res.statusCode,
    }),
  },
});
