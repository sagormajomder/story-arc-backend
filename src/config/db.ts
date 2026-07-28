import env from '@src/config/env.js';
import { logger } from '@src/shared/utils/logger.js';
import mongoose from 'mongoose';

const isProduction = env.NODE_ENV === 'production';

mongoose.set('bufferCommands', !isProduction);

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

async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: !isProduction,
      maxPoolSize: isProduction ? 50 : 20,
      minPoolSize: isProduction ? 10 : 2,
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 45_000,
      heartbeatFrequencyMS: 10_000,
      ...(isProduction && { w: 'majority' }),
    });

    logger.info(`Database is connected at ${conn.connection.host}`);
  } catch (err) {
    logger.fatal({ err }, 'Mongodb connection is failed');
    throw err;
  }
}

export default connectDB;
