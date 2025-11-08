// src/modules/article/article.routes.ts
import { Router } from "express";
import {
  listArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
} from "./article.controller.js";

export const articleRouter = Router();

/* Public (ANA SİTE) */
articleRouter.get("/", listArticles);
articleRouter.get("/:slug", getArticleBySlug);

articleRouter.post("/", createArticle);
articleRouter.patch("/:id", updateArticle);
articleRouter.delete("/:id", deleteArticle);
