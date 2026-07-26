import type { Server } from 'node:http';
import app from './app.js';
import env from './config/env.js';
import { SERVER_SHUTDOWN_TIMEOUT } from './utils/constants.js';
import logger from './utils/logger.js';

const port: number = env.PORT;
let server: Server;
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  let hasError = false;
  logger.info(`Signal ${signal} received. Shutting down gracefully...`);

  // force timer out
  const forceExitTimer = setTimeout(function () {
    logger.fatal(
      `Shutdown time ${SERVER_SHUTDOWN_TIMEOUT} passed. Forcefully shutting down the server`,
    );
    process.exit(1);
  }, SERVER_SHUTDOWN_TIMEOUT);
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

  process.exit(hasError ? 1 : 0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.once(
  'unhandledRejection',
  (reason: unknown, promise: Promise<unknown>) => {
    logger.error(
      `UNHANDLE REJECTION occurs at ${promise} , reason: ${reason} `,
    );
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
  }

  logger.fatal({ error }, 'Server encountered a fatal error');
  process.exit(1);
}

async function startServer(): Promise<void> {
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
    logger.info(`📝 API: http://localhost:${port}/v1/api`);
    logger.info(`❤️  Health: http://localhost:${port}/v1/api/health`);
  });

  server.on('error', handleServerError);

  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
}

try {
  await startServer();
} catch (error) {
  logger.fatal({ error }, 'Server failed to start');
  process.exit(1);
}
