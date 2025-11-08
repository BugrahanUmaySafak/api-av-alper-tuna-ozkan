// src/modules/article/article.routes.ts
import { Router } from "express";
import {
  listArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
} from "./article.controller.js";
import { requireAuth } from "../../middlewares/requireAuth.js";

export const articleRouter = Router();

/* Public (ANA SİTE) */
articleRouter.get("/", listArticles);
articleRouter.get("/:slug", getArticleBySlug);

/* Panel (AUTH ZORUNLU) */
articleRouter.post("/", requireAuth, createArticle);
articleRouter.patch("/:id", requireAuth, updateArticle);
articleRouter.delete("/:id", requireAuth, deleteArticle);
