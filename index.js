import cors from 'cors';
import express from 'express';
import { closeDB, connectDB } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import bookRoutes from './routes/bookRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import genreRoutes from './routes/genreRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import tutorialRoutes from './routes/tutorialRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://story-arc-sm.vercel.app'],
    credentials: true,
  }),
);
app.use(express.json());

// Server Root Route
app.get('/', (req, res) => {
  res.send('<h1>Hello World </h1>');
});

// Routes
app.use('/api/v1', userRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/genres', genreRoutes);
app.use('/api/v1/tutorials', tutorialRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Crash / Unhandled Error Listeners
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (!process.env.VERCEL) process.exit(1);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception thrown:', err);
  if (!process.env.VERCEL) process.exit(1);
});

// Vercel serverless export
export default app;

// Local Development only: Bind port and handle terminal graceful shutdown (Ctrl + C)
if (!process.env.VERCEL) {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

  const handleLocalShutdown = async signal => {
    console.log(`Received ${signal}. Shutting down local server cleanly...`);
    await closeDB();
    process.exit(0);
  };

  process.on('SIGINT', () => handleLocalShutdown('SIGINT'));
  process.on('SIGTERM', () => handleLocalShutdown('SIGTERM'));
}
