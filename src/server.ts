import type { Server } from 'node:http';
import app from './app.js';

const port: number = 8000;
let server: Server;

function startServer() {
  server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

try {
  startServer();
} catch (error) {}
