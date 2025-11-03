// src/modules/article/article.routes.ts
import { Router } from "express";
import {
  listArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  upload,
} from "./article.controller.js";

export const articleRouter = Router();

/* Public */
articleRouter.get("/", listArticles);
articleRouter.get("/:slug", getArticleBySlug);

/* Admin */
articleRouter.post("/", upload.single("file"), createArticle);
articleRouter.patch("/:id", upload.single("file"), updateArticle);
articleRouter.delete("/:id", deleteArticle);
