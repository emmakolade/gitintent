import mongoose from "mongoose";
import { env } from "@/lib/env";

declare global {
  var __mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

export async function connectDatabase(): Promise<typeof mongoose> {
  if (!env.mongoUri) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  if (!global.__mongooseConnectionPromise) {
    global.__mongooseConnectionPromise = mongoose.connect(env.mongoUri);
  }

  return global.__mongooseConnectionPromise;
}
