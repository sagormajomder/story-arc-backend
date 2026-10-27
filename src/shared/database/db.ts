import { env } from '@src/config/env.js';
import { SERVICE_NAME, TIME_MS } from '@src/shared/utils/constants.js';
import { logger } from '@src/shared/utils/logger.js';
import mongoose, { type ConnectOptions } from 'mongoose';

const POOL_CHECKOUT_TIMEOUT_MS = 2 * TIME_MS.SECOND;
const SERVER_SELECTION_TIMEOUT_MS = env.isProduction
  ? 15 * TIME_MS.SECOND
  : 5 * TIME_MS.SECOND;
const SOCKET_TIMEOUT_MS = 45 * TIME_MS.SECOND;
const QUERY_TIMEOUT_MS = 12 * TIME_MS.SECOND;

let connectionPromise: Promise<typeof mongoose> | null = null;
let closingPromise: Promise<void> | null = null;

const CONNECTION_OPTIONS: ConnectOptions = {
  appName: SERVICE_NAME,
  maxPoolSize: env.isProduction ? 50 : 10,
  minPoolSize: env.isProduction ? 5 : 0,
  maxIdleTimeMS: 60 * TIME_MS.SECOND,
  waitQueueTimeoutMS: POOL_CHECKOUT_TIMEOUT_MS,
  serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
  connectTimeoutMS: 10 * TIME_MS.SECOND,
  socketTimeoutMS: SOCKET_TIMEOUT_MS,
  heartbeatFrequencyMS: 10 * TIME_MS.SECOND,
  retryWrites: true,
  retryReads: true,
  autoIndex: env.isDevelopment,
  autoCreate: env.isDevelopment,
  ...(env.isProduction && {
    writeConcern: {
      w: 'majority',
      wtimeoutMS: QUERY_TIMEOUT_MS,
    },
  }),
};

// Global buffering settings
mongoose.set('bufferCommands', env.isDevelopment);

// Connection Lifecycle Event Listeners
mongoose.connection.on('connected', () => {
  logger.info('📗 MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('🛑 MongoDB connection disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('📗 MongoDB connection reconnected');
});

mongoose.connection.on('error', (err: Error) => {
  logger.error({ err }, '📛 MongoDB connection error:');
});

const isDbConnected = (): boolean =>
  mongoose.connection.readyState === mongoose.ConnectionStates.connected;

/**
 * Connect to MongoDB with connection deduplication
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (closingPromise) {
    throw new Error('Cannot connect: MongoDB is currently closing');
  }

  if (isDbConnected()) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const conn = await mongoose.connect(env.MONGODB_URI, CONNECTION_OPTIONS);
      const { host, name } = conn.connection;

      logger.info(
        {
          host,
          database: name,
          maxPoolSize: CONNECTION_OPTIONS.maxPoolSize,
          minPoolSize: CONNECTION_OPTIONS.minPoolSize,
          autoIndex: CONNECTION_OPTIONS.autoIndex,
        },
        'Database connection successfully configured',
      );

      return conn;
    } catch (err) {
      logger.fatal({ err }, 'Failed to establish MongoDB connection');
      throw err; // preserve root error for debugging
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

/**
 * Disconnect from MongoDB gracefully
 */
export async function disconnectDB(): Promise<void> {
  if (closingPromise) {
    return closingPromise;
  }

  closingPromise = (async () => {
    try {
      if (connectionPromise) {
        await connectionPromise.catch(() => undefined);
      }

      if (
        mongoose.connection.readyState !==
        mongoose.ConnectionStates.disconnected
      ) {
        await mongoose.connection.close();
        logger.info('Mongodb connection closed successfully');
      }
    } catch (err) {
      logger.error({ err }, 'Error during MongoDB disconnection');
      throw err;
    } finally {
      closingPromise = null;
    }
  })();

  return closingPromise;
}
