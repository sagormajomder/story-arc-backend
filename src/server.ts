import type { Server } from 'node:http';
import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';

const port: number = env.PORT;
let server: Server;

function startServer() {
  server = app.listen(port, () => {
    logger.info(`Server is running at http://localhost:${port}`);
  });
}

try {
  startServer();
} catch (error) {}
