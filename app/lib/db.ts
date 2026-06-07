import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose:
    | {
        conn: typeof import("mongoose") | null;
        promise: Promise<typeof import("mongoose")> | null;
      }
    | undefined;
}

let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = (async () => {
      try {
        const connection = await mongoose.connect(MONGODB_URI as string);
        return connection;
      } catch (err) {
        console.error("MongoDB connection error:", err);
        throw new Error("Failed to connect to the database");
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}
