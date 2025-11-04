// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";

import { env } from "./config/env.js";
import { contactRouter } from "./modules/contact/contact.routes.js";
import { articleRouter } from "./modules/article/article.routes.js";
import { videosRouter } from "./modules/videos/videos.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { categoryRouter } from "./modules/category/category.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { getMongoClient } from "./db/mongoClient.js";

export const app = express();

// Güvenlik
app.use(helmet());

// CORS
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Postman, curl
      if (env.clientOrigins.includes(origin)) return cb(null, true);
      return cb(null, false); // kibarca reddet (CORS header eklemez)
    },
    credentials: true,
  })
);

// Parsers & log
app.use(express.json({ limit: "1mb" })); // JSON limitini küçük tutmak iyi pratik
app.use(cookieParser());
app.use(morgan("dev"));
app.set("trust proxy", 1);

// Session (serverless uyumlu, paylaşımlı MongoClient)
const isProd = env.nodeEnv === "production";
app.use(
  session({
    name: "sid",
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      clientPromise: getMongoClient(),
      ttl: 60 * 60 * 12,
      autoRemove: "interval",
      autoRemoveInterval: 10,
    }),
    cookie: {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 12,
      path: "/",
    },
  })
);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Auth
app.use("/api/auth", authRouter);

// Modüller
app.use("/api/iletisim", contactRouter);
app.use("/api/makalelerim", articleRouter);
app.use("/api/videolarim", videosRouter);
app.use("/api/kategoriler", categoryRouter);

// Hata yakalayıcı — en sonda
app.use(errorHandler);
