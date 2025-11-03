// src/config/env.ts
import "dotenv/config";

const clientOrigins = [
  process.env.CLIENT_ORIGIN_PANEL, // http://localhost:3001
  process.env.CLIENT_ORIGIN_MAIN, // http://localhost:3000
].filter(Boolean) as string[];

export const env = {
  port: Number(process.env.PORT ?? 4001),
  mongoUri: process.env.MONGODB_URI ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientOrigins, // ← artık dizi
  publicSiteUrl:
    process.env.PUBLIC_SITE_URL || "https://www.alpertunaozkan.com",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
};

if (!env.mongoUri) {
  throw new Error("MONGODB_URI is missing in .env");
}

if (!env.sessionSecret) {
  throw new Error("SESSION_SECRET is missing in .env");
}
