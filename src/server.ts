import app from '@src/app.js';
import { env } from '@src/config/env.js';
import { connectDB } from '@src/shared/database/db.js';

import { logger } from '@src/shared/utils/logger.js';
import mongoose from 'mongoose';
import type { Server } from 'node:http';

const SERVER_SHUTDOWN_TIMEOUT_MS = 5000;
const KEEP_ALIVE_TIMEOUT_MS = 65_000;
const HEADERS_TIMEOUT_MS = KEEP_ALIVE_TIMEOUT_MS + 1_000;

const port: number = env.PORT;
let server: Server;
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  let hasError = false;
  logger.info(`Signal "${signal}" received. Shutting down gracefully...`);

  // force timer out
  const forceExitTimer = setTimeout(function () {
    logger.fatal(
      `Shutdown time ${SERVER_SHUTDOWN_TIMEOUT_MS} passed. Forcefully shutting down the server`,
    );
    process.exit(1);
  }, SERVER_SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()));
      });

      logger.info('Server is closed successfully');
    }
  } catch (err) {
    logger.error({ err }, '   ✗ Error closing HTTP server:');
    hasError = true;
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('Mongodb connection is closed successfully');
    }
  } catch (err) {
    logger.error({ err }, 'Error during Database closing:');
    hasError = true;
  }
  logger.info('Server shutdown completed!');
  process.exit(hasError ? 1 : 0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.once(
  'unhandledRejection',
  (reason: unknown, promise: Promise<unknown>) => {
    logger.error({ reason, promise }, 'UNHANDLED REJECTION');
    gracefulShutdown('UNHANDLE REJECTION');
  },
);

process.once('uncaughtException', (error: Error) => {
  logger.fatal({ error }, 'UNCAUGHT EXCEPTION ERROR');
  process.exit(1);
});

function handleServerError(error: NodeJS.ErrnoException) {
  if (error.code === 'EADDRINUSE') {
    logger.fatal({ port }, `Port ${port} is already in use`);
  } else if (error.code === 'EACCES') {
    logger.fatal({ port }, `Permission denied for port ${port} `);
  } else {
    logger.fatal({ error }, 'Server encountered a fatal error');
  }

  process.exit(1);
}

async function startServer(): Promise<void> {
  await connectDB();
  server = app.listen(port, () => {
    logger.info(
      {
        env: env.NODE_ENV,
        port,
        pid: process.pid,
        'node-version': process.version,
      },
      'Server is started',
    );
    logger.info(`🚀 Server is running at http://localhost:${port}`);
    logger.info(`📝 API: http://localhost:${port}/api/v1`);
    logger.info(`❤️  Health: http://localhost:${port}/api/v1/health`);
  });

  server.on('error', handleServerError);

  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.headersTimeout = HEADERS_TIMEOUT_MS;
}

try {
  await startServer();
} catch (error) {
  logger.fatal({ error }, 'Server failed to start');
  process.exit(1);
}
