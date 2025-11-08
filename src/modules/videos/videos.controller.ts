// src/modules/videos/videos.controller.ts
import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { videoSchema } from "./videos.schema.js";
import { VideoModel } from "./videos.model.js";
import {
  uploadCoverToCloudinary,
  deleteCoverFromCloudinary,
} from "./thumb.helper.js";
import { CategoryModel } from "../category/category.model.js";

/* --------------------------------------------------
   Yardımcı: DB dokümanını API formatına çevir
-------------------------------------------------- */
function mapVideo(doc: any) {
  let category:
    | {
        id: string;
        name: string;
      }
    | undefined;

  const cat = doc?.category;
  if (cat && typeof cat === "object") {
    if (cat._id && cat.name) {
      category = { id: String(cat._id), name: String(cat.name) };
    } else if (Types.ObjectId.isValid(cat)) {
      category = { id: String(cat), name: "" };
    }
  }

  return {
    id: String(doc._id),
    title: String(doc.title ?? ""),
    youtubeId: String(doc.youtubeId ?? ""),
    category,
  };
}

/* ------------------------------- LIST ------------------------------- */
export async function listVideos(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const docs = await VideoModel.find()
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    const items = (docs ?? []).map(mapVideo);
    return res.json({ items });
  } catch (err) {
    next(err);
  }
}

/* ---------------------------- GET BY ID ---------------------------- */
export async function getVideoById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Geçersiz ID" });

    const doc = await VideoModel.findById(id)
      .populate("category", "name")
      .lean();

    if (!doc) return res.status(404).json({ message: "Video bulunamadı" });

    return res.json(mapVideo(doc));
  } catch (err) {
    next(err);
  }
}

/* ------------------------------ CREATE ------------------------------ */
export async function createVideo(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = videoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }
    const body = parsed.data;

    // kategori kontrol
    let categoryId: string | undefined;
    if (body.categoryId) {
      if (!Types.ObjectId.isValid(body.categoryId)) {
        return res.status(400).json({ message: "Geçersiz kategori ID" });
      }
      const cat = await CategoryModel.findById(body.categoryId).lean();
      if (!cat) return res.status(404).json({ message: "Kategori bulunamadı" });
      categoryId = body.categoryId;
    }

    // YT’den kapak alıp Cloudinary’e yüklemeyi dene
    const uploaded = await uploadCoverToCloudinary(body.youtubeId);

    const created = await VideoModel.create({
      title: body.title,
      youtubeId: body.youtubeId,
      coverUrl: uploaded.coverUrl ?? "",
      coverPublicId: uploaded.coverPublicId ?? "",
      category: categoryId,
    });

    // ⚠️ burada populate sonrası toObject çağırmak yerine tekrar DB’den çekiyoruz
    const fresh = await VideoModel.findById(created._id)
      .populate("category", "name")
      .lean();

    return res
      .status(201)
      .json(fresh ? mapVideo(fresh) : mapVideo(created.toObject()));
  } catch (err) {
    next(err);
  }
}

/* ------------------------------ UPDATE ------------------------------ */
export async function updateVideo(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Geçersiz ID" });

    const parsed = videoSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });

    const body = parsed.data;

    const existing = await VideoModel.findById(id);
    if (!existing) return res.status(404).json({ message: "Video bulunamadı" });

    const patch: Record<string, unknown> = {};

    // başlık
    if (typeof body.title === "string") {
      patch.title = body.title;
    }

    // youtubeId değiştiyse -> eski kapağı sil, yeni kapağı yükle
    if (typeof body.youtubeId === "string" && body.youtubeId.length > 0) {
      if (body.youtubeId !== existing.youtubeId) {
        // 1) eskiyi sil
        await deleteCoverFromCloudinary(
          existing.coverPublicId || existing.youtubeId
        );

        // 2) yeniyi yükle
        const uploaded = await uploadCoverToCloudinary(body.youtubeId);
        patch.youtubeId = body.youtubeId;
        patch.coverUrl = uploaded.coverUrl ?? "";
        patch.coverPublicId = uploaded.coverPublicId ?? "";
      }
    }

    // kategori
    if (body.categoryId !== undefined) {
      if (!body.categoryId) {
        patch.category = undefined;
      } else {
        if (!Types.ObjectId.isValid(body.categoryId)) {
          return res.status(400).json({ message: "Geçersiz kategori ID" });
        }
        const cat = await CategoryModel.findById(body.categoryId).lean();
        if (!cat)
          return res.status(404).json({ message: "Kategori bulunamadı" });
        patch.category = body.categoryId;
      }
    }

    const updated = await VideoModel.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name")
      .lean();

    if (!updated) return res.status(404).json({ message: "Video bulunamadı" });

    return res.json(mapVideo(updated));
  } catch (err) {
    next(err);
  }
}

/* ------------------------------ DELETE ------------------------------ */
export async function deleteVideo(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Geçersiz ID" });

    // .lean() kullanarak basit obje alalım
    const doc = await VideoModel.findByIdAndDelete(id).lean();
    if (!doc) return res.status(404).json({ message: "Video bulunamadı" });

    // Cloudinary temizliği
    await deleteCoverFromCloudinary(doc.coverPublicId || doc.youtubeId);

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
