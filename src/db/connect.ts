// src/db/connect.ts
import mongoose from "mongoose";
import { env } from "../config/env.js";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function ensureMongoose() {
  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }
  if (!global.__mongooseConn) {
    global.__mongooseConn = mongoose.connect(env.mongoUri, {
      // serverless bağlantı optimizasyonları
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
    });
  }
  await global.__mongooseConn;
  // eslint-disable-next-line no-console
  console.log("✅ Mongoose connected");
}
