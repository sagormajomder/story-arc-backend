import { globalLimiter } from '@src/utils/limiter.js';
import { pinoHttpLogger } from '@src/utils/logger.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';

const app = express();

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

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hello World',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route Not Found',
  });
});

export default app;
