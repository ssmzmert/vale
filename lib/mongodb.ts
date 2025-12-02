import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

// Ensure .env is loaded when running standalone scripts (e.g. seeding).
if (!process.env.MONGODB_URI) {
  loadEnvConfig(process.cwd());
}

const DB_URI = process.env.MONGODB_URI as string;

if (!DB_URI) {
  throw new Error("MONGODB_URI environment variable eksik");
}

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: Cached = (global as any).mongoose;

if (!cached) {
  cached = { conn: null, promise: null };
  (global as any).mongoose = cached;
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(DB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
