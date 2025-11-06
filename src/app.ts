// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";

import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { getMongoClient } from "./db/mongoClient.js";

// Panel için kullanılan auth uçları (login/logout/me)
import { authRouter } from "./modules/auth/auth.routes.js";

// CONTROLLERS
import {
  listArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  upload as articleUpload,
} from "./modules/article/article.controller.js";

import {
  listVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
} from "./modules/videos/videos.controller.js";

import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./modules/category/category.controller.js";

import {
  createIletisim,
  listIletisim,
  deleteIletisim,
} from "./modules/contact/contact.controller.js";

import { requireAuth } from "./middlewares/requireAuth.js";

/* ========================================================================== */

export const app = express();

/* ------------------------- CORS ------------------------- */
const allowedOrigins = env.clientOrigins.filter(Boolean);
const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // same-origin / server-to-server
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Vary: Origin (cache doğruluğu için)
app.use((_, res, next) => {
  res.header("Vary", "Origin");
  next();
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.set("trust proxy", 1);

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

/* ------------------------- AUTH -------------------------- */
// (Sadece panel kullanır ama path /api/auth altında kalıyor)
app.use("/api/auth", cors(corsOptions), authRouter);

/* -------------------------- API -------------------------- */
// Tüm uçlar /api altında; public ve auth’lu uçları aynı router’da ayırıyoruz
const api = express.Router();

/* ======== PUBLIC (ANA SİTE) ======== */
// Makaleler (sadece GET)
api.get("/makalelerim", listArticles);
api.get("/makalelerim/:slug", getArticleBySlug);

// Videolar (sadece GET)
api.get("/videolarim", listVideos);
api.get("/videolarim/:id", getVideoById);

// İletişim (sadece POST public)
api.post("/iletisim", createIletisim);

/* ======== PANEL (AUTH ZORUNLU) ======== */
// Makaleler CRUD
api.post(
  "/makalelerim",
  requireAuth,
  articleUpload.single("file"),
  createArticle
);
api.patch(
  "/makalelerim/:id",
  requireAuth,
  articleUpload.single("file"),
  updateArticle
);
api.delete("/makalelerim/:id", requireAuth, deleteArticle);

api.post("/videolarim", requireAuth, createVideo);
api.patch("/videolarim/:id", requireAuth, updateVideo);
api.delete("/videolarim/:id", requireAuth, deleteVideo);

api.get("/kategoriler", requireAuth, listCategories);
api.post("/kategoriler", requireAuth, createCategory);
api.patch("/kategoriler/:id", requireAuth, updateCategory);
api.delete("/kategoriler/:id", requireAuth, deleteCategory);

api.get("/iletisim", requireAuth, listIletisim);
api.delete("/iletisim/:id", requireAuth, deleteIletisim);

app.use("/api", cors(corsOptions), api);

app.use(errorHandler);
