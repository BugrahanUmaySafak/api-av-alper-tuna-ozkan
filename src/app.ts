import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";

import { env } from "./config/env.js";
import { contactRouter } from "./modules/contact/contact.routes.js";
import { articleRouter } from "./modules/article/article.routes.js";
import { videosRouter } from "./modules/videos/videos.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { categoryRouter } from "./modules/category/category.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

// Güvenlik
app.use(helmet());

// CORS
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Postman, curl
      if (env.clientOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

// Parsers & log
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.set("trust proxy", 1);

// Session (mevcut Mongoose bağlantısını kullan)
const isProd = env.nodeEnv === "production";

const sessionStore = MongoStore.create({
  // Mongoose bağlanınca al; ikinci bir MongoClient açma
  clientPromise: mongoose.connection
    .asPromise()
    .then(() => mongoose.connection.getClient()),
  ttl: 60 * 60 * 12, // 12 saat
  autoRemove: "interval",
  autoRemoveInterval: 10,
});

app.use(
  session({
    name: "sid",
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
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
app.get(["/health", "/api/health"], (_req, res) => res.json({ ok: true }));

// Auth
app.use("/api/auth", authRouter);

// Modüller
app.use("/api/iletisim", contactRouter);
app.use("/api/makalelerim", articleRouter);
app.use("/api/videolarim", videosRouter);
app.use("/api/kategoriler", categoryRouter);

// Hata yakalayıcı — en sonda
app.use(errorHandler);
