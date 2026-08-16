import mongoose from "mongoose";
import { env } from "@/lib/env";

declare global {
  var __mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

const DB_CONNECT_TIMEOUT_MS = 7000;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (!env.mongoUri) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  if (!global.__mongooseConnectionPromise) {
    global.__mongooseConnectionPromise = mongoose
      .connect(env.mongoUri, {
        serverSelectionTimeoutMS: DB_CONNECT_TIMEOUT_MS,
        connectTimeoutMS: DB_CONNECT_TIMEOUT_MS,
      })
      .catch((error) => {
        // Reset cached promise on failure so later requests can retry.
        global.__mongooseConnectionPromise = undefined;
        throw error;
      });
  }

  return await Promise.race([
    global.__mongooseConnectionPromise,
    new Promise<typeof mongoose>((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`MongoDB connection timeout after ${DB_CONNECT_TIMEOUT_MS}ms`));
      }, DB_CONNECT_TIMEOUT_MS);
    }),
  ]);
}
