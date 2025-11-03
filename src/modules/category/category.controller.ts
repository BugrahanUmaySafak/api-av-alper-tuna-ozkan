import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { CategoryModel } from "./category.model.js";
import { categorySchema } from "./category.schema.js";
import { ArticleModel } from "../article/article.model.js";
import { VideoModel } from "../videos/videos.model.js"; // 👈 videoları da kontrol et

/* ------------------------------- LIST ------------------------------- */
export async function listCategories(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const items = await CategoryModel.find().sort({ name: 1 }).lean();
    const mapped = items.map((it) => ({
      id: String(it._id),
      name: it.name,
    }));
    return res.json({ items: mapped });
  } catch (err) {
    next(err);
  }
}

/* ------------------------------ CREATE ------------------------------ */
export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const name = String(req.body?.name ?? "").trim();

    const parsed = categorySchema.safeParse({ name });
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    // case-insensitive aynı isim var mı?
    const exists = await CategoryModel.findOne({ name: parsed.data.name })
      .collation({ locale: "tr", strength: 2 })
      .lean();
    if (exists) {
      return res.status(409).json({ message: "Bu kategori adı zaten var." });
    }

    const created = await CategoryModel.create({ name: parsed.data.name });
    return res
      .status(201)
      .json({ id: String(created._id), name: created.name });
  } catch (err: any) {
    // unique index'ten de gelebilir
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Bu kategori adı zaten var." });
    }
    next(err);
  }
}

/* ------------------------------- UPDATE ----------------------------- */
export async function updateCategory(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Geçersiz ID" });
    }

    const name = String(req.body?.name ?? "").trim();
    const parsed = categorySchema.safeParse({ name });
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    // başka bir kategori bu ismi kullanıyor mu?
    const conflict = await CategoryModel.findOne({
      _id: { $ne: id },
      name: parsed.data.name,
    })
      .collation({ locale: "tr", strength: 2 })
      .lean();
    if (conflict) {
      return res.status(409).json({ message: "Bu kategori adı zaten var." });
    }

    const updated = await CategoryModel.findByIdAndUpdate(
      id,
      { name: parsed.data.name },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Kategori bulunamadı" });
    }

    return res.json({ id: String(updated._id), name: updated.name });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Bu kategori adı zaten var." });
    }
    next(err);
  }
}

/* ------------------------------- DELETE ----------------------------- */
export async function deleteCategory(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Geçersiz ID" });
    }

    // 1) makalede kullanılıyor mu?
    const articleInUse = await ArticleModel.exists({ category: id });
    if (articleInUse) {
      return res.status(409).json({
        message: "Bu kategori bazı makalelerde kullanılıyor.",
        code: "CATEGORY_IN_ARTICLES",
      });
    }

    // 2) videoda kullanılıyor mu?
    const videoInUse = await VideoModel.exists({ category: id });
    if (videoInUse) {
      return res.status(409).json({
        message: "Bu kategori bazı videolarda kullanılıyor.",
        code: "CATEGORY_IN_VIDEOS",
      });
    }

    const deleted = await CategoryModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Kategori bulunamadı" });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
