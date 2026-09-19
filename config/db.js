import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

let client = null;
let db = null;
export const collections = {};

export function getClient() {
  if (!client) {
    if (!uri) {
      throw new Error(
        'MongoDB URI missing in environment variables (MONGODB_URI or DB_URI)',
      );
    }
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 5,
    });
  }
  return client;
}

function getDb(dbName = process.env.DB_NAME) {
  if (!db) {
    db = dbName ? getClient().db(dbName) : getClient().db();
  }
  return db;
}

export async function connectDB() {
  try {
    await getClient().connect();
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

collections.users = getDb().collection('users');
collections.books = getDb().collection('books');
collections.genres = getDb().collection('genres');
collections.tutorials = getDb().collection('tutorials');
collections.reviews = getDb().collection('reviews');

export async function closeDB() {
  if (client) {
    try {
      await client.close();
      console.log('MongoDB connection closed cleanly.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    } finally {
      client = null;
      db = null;
    }
  }
}
