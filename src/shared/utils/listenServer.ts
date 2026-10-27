import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

const IDLE_SWEEP_INTERVAL_MS = 100;

type ServerErrorHandler = (err: Error) => void;

export const listenServer = (
  httpServer: Server,
  port: number,
  onRuntimeError?: ServerErrorHandler,
): Promise<AddressInfo> =>
  new Promise<AddressInfo>((resolve, reject) => {
    const detachStartupListeners = (): void => {
      httpServer.off('error', onBindError);
      httpServer.off('listening', onListening);
    };

    const onBindError = (err: Error): void => {
      detachStartupListeners();
      reject(err);
    };

    const onListening = (): void => {
      const address = httpServer.address();

      if (address === null || typeof address === 'string') {
        const error = new Error(
          `Exprected a tcp address after binding port ${port}`,
        );
        detachStartupListeners();

        if (!httpServer.listening) {
          reject(error);
          return;
        }

        try {
          httpServer.close(() => reject(error));
        } catch {
          reject(error);
        }
        return;
      }

      if (onRuntimeError) httpServer.on('error', onRuntimeError);
      detachStartupListeners();
      resolve(address);
    };

    httpServer.on('error', onBindError);
    httpServer.on('listening', onListening);

    try {
      httpServer.listen(port);
    } catch (err) {
      detachStartupListeners();
      reject(err);
    }
  });

export const closedServer = async (httpServer: Server): Promise<boolean> => {
  if (!httpServer.listening) return false;

  const idleSweeper = setInterval(() => {
    httpServer.closeIdleConnections();
  }, IDLE_SWEEP_INTERVAL_MS);

  try {
    await new Promise<void>((resolve, reject) => {
      httpServer.close(err => (err ? reject(err) : resolve()));
      httpServer.closeIdleConnections();
    });
  } finally {
    clearInterval(idleSweeper);
  }

  return true;
};
