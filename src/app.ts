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

// ---- CORS seçenekleri (Express 5 uyumlu) ----
const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    // Postman/cURL gibi originsiz istekler
    if (!origin) return cb(null, true);
    // İzin verilen originler (.env'den geliyor)
    if (env.clientOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.set("trust proxy", 1);

// *** ÖNEMLİ: CORS middleware'i en üste koy ***
app.use(cors(corsOptions));

// *** Express 5'te '*' YASAK. Preflight için '(.*)' kullan ***
app.options("(.*)", cors(corsOptions));

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
      domain: isProd ? ".alpertunaozkan.com" : undefined,
    },
  })
);

// Sağlık kontrolü
app.get(["/health", "/api/health"], (_req, res) => res.json({ ok: true }));

// API yolları
app.use("/api/auth", authRouter);
app.use("/api/iletisim", contactRouter);
app.use("/api/makalelerim", articleRouter);
app.use("/api/videolarim", videosRouter);
app.use("/api/kategoriler", categoryRouter);

// Hata yakalayıcı — en sonda
app.use(errorHandler);
