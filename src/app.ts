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

// ---- Health endpoint'i EN ÜSTE al: session/DB beklemesin
app.get(["/health", "/api/health"], (_req, res) => res.json({ ok: true }));

// ---- Session'ı LAZY kur (health için çalışmasın)
const isProd = env.nodeEnv === "production";
const buildSession = () =>
  session({
    name: "sid",
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: env.mongoUri, // <-- clientPromise yerine mongoUrl
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
  });

// Sadece health dışındaki path’lerde session kur
app.use((req, res, next) => {
  const p = req.path || "";
  if (p === "/health" || p === "/api/health") return next();
  return buildSession()(req, res, next);
});

// Auth
app.use("/api/auth", authRouter);

// Modüller
app.use("/api/iletisim", contactRouter);
app.use("/api/makalelerim", articleRouter);
app.use("/api/videolarim", videosRouter);
app.use("/api/kategoriler", categoryRouter);

// Hata yakalayıcı
app.use(errorHandler);
