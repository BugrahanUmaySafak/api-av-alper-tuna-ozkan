// src/modules/category/category.routes.ts
import { Router } from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller.js";
import { requireAuth } from "../../middlewares/requireAuth.js";

export const categoryRouter = Router();

/* Public (ANA SİTE) */
categoryRouter.get("/", listCategories);

/* Panel (AUTH ZORUNLU) */
categoryRouter.post("/", requireAuth, createCategory);
categoryRouter.patch("/:id", requireAuth, updateCategory);
categoryRouter.delete("/:id", requireAuth, deleteCategory);
