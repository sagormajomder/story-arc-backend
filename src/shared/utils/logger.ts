import pino from 'pino';
import { pinoHttp } from 'pino-http';

const isProduction: boolean = process.env.NODE_ENV === 'production';

const logger = pino({
  level: !isProduction ? 'debug' : 'info',
  ...(!isProduction && { transport: { target: 'pino-pretty' } }),
});

export default logger;

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
