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

/* ------------------------- CORS ------------------------- */
const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl/postman/same-origin
    if (env.clientOrigins.includes(origin)) return cb(null, true);
    return cb(null, false); // 500 atma
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

// CORS middleware
app.use(cors(corsOptions));

// 🔧 Express 5: preflight için **regex** kullan
// tüm yollar:  /^\/.*$/
// sadece API:  /^\/api\/.*$/
app.options(/^\/.*$/, cors(corsOptions));

/* --------------------- SESSION (Mongo) ------------------- */
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

/* ------------------------ HEALTH ------------------------ */
app.get(["/health", "/api/health"], (_req, res) => res.json({ ok: true }));

/* ------------------------- ROUTES ------------------------ */
app.use("/api/auth", authRouter);
app.use("/api/iletisim", contactRouter);
app.use("/api/makalelerim", articleRouter);
app.use("/api/videolarim", videosRouter);
app.use("/api/kategoriler", categoryRouter);

/* ---------------------- ERROR HANDLER -------------------- */
app.use(errorHandler);
