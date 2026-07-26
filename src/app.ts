import logger from '@src/utils/logger.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { Request, Response } from 'express';
import express from 'express';
import rateLimit, { MINUTE } from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import { pinoHttp } from 'pino-http';

const app = express();

const globalLimiter = rateLimit({
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

const pinoHttpLogger = pinoHttp({
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

// Health Check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'server is healthy',
    uptime: process.uptime(),
  });
});
// ////////////////////////////
// Global middleware
// ////////////////////////////
// 1. Trust Proxy Setup (Essential for Rate Limiting behind Nginx / Cloudflare)
app.set('trust proxy', 1);
// 2. Base Security & Headers
app.use(helmet());
app.use(cors({}));
// 3. Global Rate Limiter (Placed BEFORE body parser to save CPU/RAM)
app.use(globalLimiter);
// 4. Body Parsers & Cookie Parser
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(hpp());
// 5. Request Logging
app.use(pinoHttpLogger);

// ////////////////////////////
// Routes
// ////////////////////////////

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route Not Found',
  });
});

export default app;
