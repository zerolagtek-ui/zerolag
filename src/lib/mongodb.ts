import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export function isMongoConfigured(): boolean {
  return typeof MONGODB_URI === 'string' && MONGODB_URI.trim().length > 0;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.log('[MongoDB] Successfully connected to MongoDB Atlas database.');
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.warn('[MongoDB Warning] Failed to connect to MongoDB Atlas:', err instanceof Error ? err.message : err);
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.warn('[MongoDB Exception]:', err);
    return null;
  }

  return cached.conn;
}

export default connectToDatabase;
