import { env } from '@src/config/env.js';
import { TIME_MS } from '@src/shared/utils/constants.js';
import { logger } from '@src/shared/utils/logger.js';
import mongoose from 'mongoose';

const SERVER_SELECTION_TIMEOUT_MS = 5 * TIME_MS.SECOND;
const SOCKET_TIMEOUT_MS = 45 * TIME_MS.SECOND;
const HEARTBEAT_FREQUENCY_MS = 10 * TIME_MS.SECOND;

mongoose.set('bufferCommands', env.isDevelopment);

mongoose.connection.on('disconnected', () => {
  logger.warn('🛑 Database is disconnected');
});

mongoose.connection.on('connected', () => {
  logger.info('📗 MongoDb is connected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('📗 MongoDb is reconnected');
});

mongoose.connection.on('error', (err: Error) => {
  logger.error({ message: err.message }, '📛 MongoDB connection error:');
});

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.isDevelopment,
      maxPoolSize: env.isProduction ? 50 : 20,
      minPoolSize: env.isProduction ? 10 : 2,
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: SOCKET_TIMEOUT_MS,
      heartbeatFrequencyMS: HEARTBEAT_FREQUENCY_MS,
      ...(env.isProduction && { w: 'majority' }),
    });

    logger.info(`Database is connected at ${conn.connection.host}`);
  } catch (err) {
    logger.fatal({ err }, 'Mongodb connection is failed');
    throw err;
  }
}
