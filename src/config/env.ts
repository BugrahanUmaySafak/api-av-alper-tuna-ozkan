// src/config/env.ts
import "dotenv/config";

const defaultClientOrigins = [
  "https://panel.alpertunaozkan.com",
  "https://www.alpertunaozkan.com",
  "https://alpertunaozkan.com",
];

const clientOrigins = Array.from(
  new Set(
    [
      ...defaultClientOrigins,
      process.env.CLIENT_ORIGIN_PANEL,
      process.env.CLIENT_ORIGIN_MAIN,
      process.env.CLIENT_ORIGIN_MAIN_2,
      process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined,
      process.env.NODE_ENV !== "production" ? "http://localhost:3001" : undefined,
    ].filter(Boolean)
  )
) as string[];

export const env = {
  port: Number(process.env.PORT ?? 4001),
  mongoUri: process.env.MONGODB_URI ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientOrigins,
  publicSiteUrl:
    process.env.PUBLIC_SITE_URL || "https://www.alpertunaozkan.com",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    articleFolder: process.env.CLOUDINARY_ARTICLE_FOLDER ?? "articles",
    articleUploadPreset: process.env.CLOUDINARY_ARTICLE_UPLOAD_PRESET ?? "",
  },
};
