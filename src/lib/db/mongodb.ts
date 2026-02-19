import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

const cached = (global as typeof globalThis & { mongoose?: { conn: mongoose.Mongoose | null; promise: Promise<mongoose.Mongoose> | null } }).mongoose ?? { conn: null, promise: null };

if (!(global as typeof globalThis & { mongoose?: unknown }).mongoose) {
  (global as typeof globalThis & { mongoose?: typeof cached }).mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const dbName = process.env.MONGODB_DB_NAME ?? "asset-ace";
    cached.promise = mongoose.connect(uri, { bufferCommands: false, dbName });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
