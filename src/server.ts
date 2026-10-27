import app, { API_TIMEOUT_MS } from '@src/app.js';
import { env } from '@src/config/env.js';
import { connectDB, disconnectDB } from '@src/shared/database/db.js';
import { TIME_MS } from '@src/shared/utils/constants.js';
import { beginShutdown, isShuttingDown } from '@src/shared/utils/lifeCycle.js';
import { closedServer, listenServer } from '@src/shared/utils/listenServer.js';
import { logger } from '@src/shared/utils/logger.js';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

// ============================================================================
// TIMEOUT CONFIGURATION (CALIBRATED SPECIFICALLY FOR RENDER.COM)
// ============================================================================
// Render sends SIGTERM during deploy/restart and forcefully kills (SIGKILL) after 30s.
// All lifecycle stages (Drain + In-flight Requests + Cleanup + Log flush) must
// complete safely within Render's 30,000 ms ceiling.
// ============================================================================
const KEEP_ALIVE_TIMEOUT_MS = 65 * TIME_MS.SECOND;
const HEADERS_TIMEOUT_MS = KEEP_ALIVE_TIMEOUT_MS + 1 * TIME_MS.SECOND;
const REQUEST_TIMEOUT_MS = 5 * TIME_MS.SECOND; // Time budget to receive entire request from client
const DRAIN_DELAY_MS = env.isProduction ? 2 * TIME_MS.SECOND : 0; // 2s drain delay for reverse proxy rerouting
const CONNECTION_CHECKING_INTERVAL_MS = 2 * TIME_MS.SECOND;
const CLEANUP_MARGIN_MS = 3 * TIME_MS.SECOND; // 3s budget for MongoDB disconnection and server cleanup

// Worst-case duration for in-flight requests to complete before force-close
const REQUEST_TAIL_MS =
  REQUEST_TIMEOUT_MS +
  Math.max(CONNECTION_CHECKING_INTERVAL_MS, API_TIMEOUT_MS); // 5s + 15s = 20,000ms

// Maximum grace period before forcibly closing active sockets
const SERVER_SHUTDOWN_TIMEOUT_MS = REQUEST_TAIL_MS + CLEANUP_MARGIN_MS; // 20s + 3s = 23,000ms

const LOGFLUSH_TIMEOUT_MS = 500;

// Total termination deadline: 2s (drain) + 23s (shutdown) + 0.5s (flush) = 25.5s
// Safely under Render's 30.0s hard cutoff with a ~4.5s safety buffer.
const TERMINATION_DEADLINE_MS =
  DRAIN_DELAY_MS + SERVER_SHUTDOWN_TIMEOUT_MS + LOGFLUSH_TIMEOUT_MS;

let server: Server | null = null;
let httpClosePromise: Promise<void> | null = null;
let listenPromise: Promise<AddressInfo> | null = null;
let exitPromise: Promise<never> | null = null;
let drainController: AbortController | null = null;
let pendingExitCode = 0;

type CleanUpStep = readonly [label: string, close: () => void | Promise<void>];

const logSafely = (
  level: 'fatal' | 'error' | 'warn' | 'info',
  bindings: Record<string, unknown>,
  message: string,
): void => {
  try {
    logger[level](bindings, message);
  } catch {
    try {
      logger[level](`${message} (error details unserializable)`);
    } catch {
      // Fallback if pino write fails
    }
  }
};

const runCleanUpStep = async ([label, close]: CleanUpStep): Promise<void> => {
  try {
    await close();
  } catch (error) {
    pendingExitCode = 1;
    logSafely('error', { error }, `Failed to close ${label}`);
  }
};

const LISTEN_ERRORS: Readonly<Record<string, string>> = {
  EADDRINUSE: 'is already in use',
  EACCES: 'requires elevated privileges',
};

const abortGracefulShutdown = (): void => {
  drainController?.abort();
  server?.closeAllConnections();
};

const exitAfterFlush = async (code: number): Promise<never> => {
  if (code !== 0) pendingExitCode = code;

  exitPromise ??= (async (): Promise<never> => {
    await Promise.race([
      new Promise<void>(resolve => {
        const flushFn = (
          logger as unknown as { flush?: (cb: () => void) => void }
        ).flush;
        if (typeof flushFn === 'function') {
          flushFn.call(logger, () => resolve());
        } else {
          resolve();
        }
      }),
      delay(LOGFLUSH_TIMEOUT_MS),
    ]).catch(() => undefined);
    process.exit(pendingExitCode);
  })();

  return exitPromise;
};

const closeHttpServer = async (): Promise<void> => {
  if (httpClosePromise) return httpClosePromise;
  const activeServer = server;
  if (!activeServer) return;

  httpClosePromise = (async (): Promise<void> => {
    let listenError: unknown;

    try {
      if (listenPromise) await listenPromise;
    } catch (error) {
      listenError = error;
    }

    if (await closedServer(activeServer)) {
      logSafely('info', {}, 'HTTP server closed.');
    }
    if (listenError) throw listenError;
  })();

  return httpClosePromise;
};

const shutdown = async (reason: string, exitCode: number): Promise<void> => {
  if (exitCode !== 0 && pendingExitCode === 0) pendingExitCode = exitCode;

  if (isShuttingDown()) {
    if (exitCode !== 0) {
      abortGracefulShutdown();
      logSafely('error', { reason, exitCode }, 'Fatal error during shutdown');
    }
    return;
  }
  beginShutdown();
  logSafely('info', { reason, exitCode }, 'Shutting down gracefully');

  // Drain Delay for in-flight proxy routing
  if (pendingExitCode === 0 && DRAIN_DELAY_MS > 0) {
    logSafely(
      'info',
      { drainDelayMS: DRAIN_DELAY_MS },
      'Draining before closing listener',
    );
    drainController = new AbortController();
    try {
      await delay(DRAIN_DELAY_MS, undefined, {
        signal: drainController.signal,
      });
    } catch (error) {
      if (!drainController.signal.aborted) throw error;
    } finally {
      drainController = null;
    }
  }

  if (pendingExitCode !== 0) server?.closeAllConnections();

  // Force Exit fallback timer
  const forceTimer = setTimeout(() => {
    logSafely(
      'error',
      { timeoutMS: SERVER_SHUTDOWN_TIMEOUT_MS },
      'Graceful shutdown timed out, forcing exit',
    );

    server?.closeAllConnections();
    void exitAfterFlush(1);
  }, SERVER_SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref();

  // Cleanup: HTTP server and Database
  await runCleanUpStep(['HTTP server', closeHttpServer]);
  await runCleanUpStep(['Database connection', disconnectDB]);

  clearTimeout(forceTimer);
  await exitAfterFlush(pendingExitCode);
};

const initiateShutdown = (reason: string, exitCode: number): void => {
  void shutdown(reason, exitCode).catch(async (err: unknown) => {
    pendingExitCode = 1;
    abortGracefulShutdown();
    logSafely('fatal', { err, reason }, 'Shutdown failed, forcing exit');
    void exitAfterFlush(1);
  });
};

const attachProcessHandlers = (): void => {
  const onFatal =
    (reason: string, level: 'fatal' | 'error') =>
    (err: unknown): void => {
      logSafely(level, { err }, `${reason} - initiating shutdown`);
      initiateShutdown(reason, 1);
    };

  process.on('uncaughtException', onFatal('uncaughtException', 'fatal'));
  process.on('unhandledRejection', onFatal('unhandledRejection', 'error'));

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGQUIT', 'SIGHUP'];
  for (const signal of signals) {
    process.on(signal, () => {
      if (isShuttingDown()) {
        pendingExitCode = 1;
        abortGracefulShutdown();
        logSafely(
          'warn',
          { signal },
          'Repeated termination signal forcing exit',
        );
        void exitAfterFlush(1);
        return;
      }
      initiateShutdown(signal, 0);
    });
  }
};

const startServer = async (): Promise<void> => {
  await connectDB();
  if (isShuttingDown()) return;

  const httpServer = createServer(
    { connectionsCheckingInterval: CONNECTION_CHECKING_INTERVAL_MS },
    app,
  );
  server = httpServer;
  httpServer.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  httpServer.headersTimeout = HEADERS_TIMEOUT_MS;
  httpServer.requestTimeout = REQUEST_TIMEOUT_MS;

  if (isShuttingDown()) return;

  const onServerError = (err: Error): void => {
    logSafely('fatal', { err }, 'Server encountered a fatal error');
    initiateShutdown('serverError', 1);
  };

  const pendingListen = (listenPromise = listenServer(
    httpServer,
    env.PORT,
    onServerError,
  ));

  let address: AddressInfo;

  try {
    address = await pendingListen;
  } finally {
    if (listenPromise === pendingListen) listenPromise = null;
  }

  if (isShuttingDown()) {
    await closeHttpServer();
    return;
  }

  logger.info(
    {
      port: address.port,
      env: env.NODE_ENV,
      pid: process.pid,
      node: process.version,
      terminationDeadline: TERMINATION_DEADLINE_MS,
    },
    'Server started',
  );

  if (env.isDevelopment) {
    const baseUrl = `http://localhost:${env.PORT}`;
    logger.info(
      { api: `${baseUrl}/api/v1`, health: `${baseUrl}/api/v1/health` },
      'local endpoints',
    );
  }
};

attachProcessHandlers();

try {
  await startServer();
} catch (err: unknown) {
  const code = (err as NodeJS.ErrnoException | null)?.code ?? '';

  const listenError = LISTEN_ERRORS[code];
  logSafely(
    'fatal',
    { err, ...(listenError && { port: env.PORT }) },
    listenError ? `port ${env.PORT} ${listenError}` : 'Failed to start server',
  );

  await shutdown('serverStartupFailure', 1);
}
