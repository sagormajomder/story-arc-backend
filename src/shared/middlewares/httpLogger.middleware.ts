import { logger } from '@src/shared/utils/logger.js';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';

export const pinoHttpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existingId = req.headers['x-request-id'] as string | undefined;
    const id = existingId || randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  autoLogging: {
    ignore: req => req.url?.split('?')[0] === '/api/v1/health',
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
