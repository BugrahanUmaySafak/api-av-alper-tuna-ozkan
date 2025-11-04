// src/modules/article/article.controller.ts
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { Types } from "mongoose";
import cloudinary from "../../config/cloudinary.js"; // ⬅️ kendi config’in
import { ArticleModel } from "./article.model.js";
import { articleSchema } from "./article.schema.js";
import { slugify } from "../../utils/slugifyTR.js";
import { CategoryModel } from "../category/category.model.js";
import {
  tinyBlurCloudinary,
  tinyBlurFillCloudinary,
  noCropFitCloudinary,
  chooseNoCropUnder1MB,
} from "../../utils/cloudinaryUrl.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

/* ------------------------------------------------------------------ */
/*  ortak yardımcılar                                                  */
/* ------------------------------------------------------------------ */

async function destroyIfExists(publicId?: string | null) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch {
    // sessiz geç
  }
}

async function uploadToCloudinary(
  file: Express.Multer.File
): Promise<{ url: string; tinyUrl: string; publicId: string }> {
  const res: any = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "articles",
        resource_type: "image",
        overwrite: false,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });

  const publicId = res.public_id as string;
  const rawUrl = res.secure_url as string;

  // 👇 1 MB altına düşürme – SENDE VAR OLAN DAVRANIŞ
  const optimizedUrl =
    (await chooseNoCropUnder1MB(
      rawUrl,
      [1920, 1600],
      ["auto:eco", "auto:low", 60]
    )) ?? noCropFitCloudinary(rawUrl, { w: 1600 })!;

  const tinyUrl =
    tinyBlurCloudinary(rawUrl) ??
    tinyBlurFillCloudinary(rawUrl, { fillWidth: 1600 }) ??
    rawUrl;

  return { url: optimizedUrl, tinyUrl, publicId };
}

// dış URL geldiyse içeri al
async function importUrlToCloudinary(
  url: string
): Promise<{ url: string; tinyUrl: string; publicId: string }> {
  const res = await cloudinary.uploader.upload(url, {
    folder: "articles",
    resource_type: "image",
    overwrite: false,
  });

  const publicId = res.public_id as string;
  const rawUrl = res.secure_url as string;

  const optimizedUrl =
    (await chooseNoCropUnder1MB(
      rawUrl,
      [1920, 1600],
      ["auto:eco", "auto:low", 60]
    )) ?? noCropFitCloudinary(rawUrl, { w: 1600 })!;

  const tinyUrl =
    tinyBlurCloudinary(rawUrl) ??
    tinyBlurFillCloudinary(rawUrl, { fillWidth: 1600 }) ??
    rawUrl;

  return { url: optimizedUrl, tinyUrl, publicId };
}

function parseIncomingBody(req: Request): any {
  const b: any = req.body ?? {};
  if (typeof b.data === "string") {
    try {
      return JSON.parse(b.data);
    } catch {
      return b;
    }
  }
  return b;
}

function mapArticle(doc: any) {
  return {
    id: String(doc._id),
    title: String(doc.title ?? ""),
    slug: String(doc.slug ?? ""),
    content: String(doc.content ?? ""),
    image: {
      url: String(doc?.image?.url ?? ""),
      alt: String(doc?.image?.alt ?? ""),
      tinyUrl: doc?.image?.tinyUrl ?? undefined,
    },
    summary: doc?.summary ?? undefined,
    category: doc?.category
      ? { id: String(doc.category._id), name: doc.category.name }
      : undefined,
    keywords: Array.isArray(doc?.keywords) ? doc.keywords : [],
    publishedAt: doc?.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: doc?.updatedAt?.toISOString?.(),
    readingMinutes:
      typeof doc?.readingMinutes === "number" ? doc.readingMinutes : undefined,
  };
}

/* -------------------------------- LIST -------------------------------- */
export async function listArticles(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const items = await ArticleModel.find({})
      .populate({ path: "category", select: "name" })
      .sort({ createdAt: -1, _id: -1 })
      .lean()
      .exec();

    res.json({ items: (items ?? []).map(mapArticle) });
  } catch (e) {
    next(e);
  }
}

/* --------------------------- GET BY SLUG --------------------------- */
export async function getArticleBySlug(
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { slug } = req.params;
    const doc = await ArticleModel.findOne({ slug })
      .collation({ locale: "tr", strength: 2 })
      .populate("category", "name")
      .lean()
      .exec();

    if (!doc) return res.status(404).json({ message: "Makale bulunamadı" });
    res.json(mapArticle(doc));
  } catch (e) {
    next(e);
  }
}

/* -------------------------------- CREATE -------------------------------- */
export async function createArticle(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const raw = parseIncomingBody(req);
    const parsed = articleSchema.safeParse(raw);
    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });
    const body = parsed.data;

    // slug: ya frontend’den gelir ya da başlıktan üretiriz
    const baseSlug = body.slug ? slugify(body.slug) : slugify(body.title);
    let uniqueSlug = baseSlug;
    let i = 1;
    while (
      await ArticleModel.findOne({ slug: uniqueSlug })
        .collation({ locale: "tr", strength: 2 })
        .lean()
    ) {
      uniqueSlug = `${baseSlug}-${i++}`;
    }

    // 🟣 kategori: id mi geldi, isim mi geldi?
    let catId: string | undefined;
    if (body.categoryId) {
      if (!Types.ObjectId.isValid(body.categoryId))
        return res.status(400).json({ message: "Geçersiz kategori ID" });
      const cat = await CategoryModel.findById(body.categoryId).lean();
      if (!cat) return res.status(404).json({ message: "Kategori bulunamadı" });
      catId = body.categoryId;
    } else if (body.category) {
      const cat = await CategoryModel.findOne({ name: body.category })
        .collation({ locale: "tr", strength: 2 })
        .lean();
      if (!cat) return res.status(404).json({ message: "Kategori bulunamadı" });
      catId = String(cat._id);
    }

    if (!body.image?.alt)
      return res
        .status(400)
        .json({ message: "Görsel açıklaması (alt) zorunludur" });

    let url = body.image?.url || "";
    let tinyUrl: string | undefined;
    let publicId: string | undefined;

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file);
      url = uploaded.url;
      tinyUrl = uploaded.tinyUrl;
      publicId = uploaded.publicId;
    } else if (url) {
      const imported = await importUrlToCloudinary(url);
      url = imported.url;
      tinyUrl = imported.tinyUrl;
      publicId = imported.publicId;
    } else {
      return res
        .status(400)
        .json({ message: "Görsel yüklenmeli veya URL verilmelidir." });
    }

    const created = await ArticleModel.create({
      title: body.title,
      slug: uniqueSlug,
      content: body.content,
      image: { url, alt: body.image.alt, tinyUrl, publicId },
      summary: body.summary,
      category: catId,
      keywords: body.keywords ?? [],
      readingMinutes: body.readingMinutes,
    });

    const doc = await created.populate("category", "name");
    return res.status(201).json(mapArticle(doc.toObject()));
  } catch (e) {
    next(e);
  }
}

/* -------------------------------- UPDATE -------------------------------- */
export async function updateArticle(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Geçersiz ID" });

    const existing = await ArticleModel.findById(id);
    if (!existing)
      return res.status(404).json({ message: "Makale bulunamadı" });

    const bodyKeys = Object.keys(req.body ?? {});
    const isFileOnlyUpload =
      !!req.file &&
      (bodyKeys.length === 0 ||
        (bodyKeys.length === 1 &&
          (bodyKeys[0] === "slug" ||
            bodyKeys[0] === "_action" ||
            bodyKeys[0] === "data")));

    // 1) sadece görsel yüklüyorsa (panelde Hero’dan upload)
    if (isFileOnlyUpload) {
      await destroyIfExists(existing.image?.publicId);
      const uploaded = await uploadToCloudinary(req.file!);
      existing.image = {
        url: uploaded.url,
        tinyUrl: uploaded.tinyUrl,
        alt: existing.image?.alt || "Kapak görseli",
        publicId: uploaded.publicId,
      };
      await existing.save();
      return res.json({
        image: { url: uploaded.url, tinyUrl: uploaded.tinyUrl },
      });
    }

    // 2) normal patch — 🔴 BURASI ARTIK PARTIAL!
    const raw = parseIncomingBody(req);
    const parsed = articleSchema.partial().safeParse(raw);
    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });
    const body = parsed.data;

    // başlık/slug değişikliği
    if (body.title && body.title !== existing.title) {
      const baseSlug = body.slug
        ? slugify(body.slug)
        : slugify(body.title ?? existing.title);
      let uniqueSlug = baseSlug;
      let i = 1;
      while (
        await ArticleModel.findOne({ _id: { $ne: id }, slug: uniqueSlug })
          .collation({ locale: "tr", strength: 2 })
          .lean()
      ) {
        uniqueSlug = `${baseSlug}-${i++}`;
      }
      existing.slug = uniqueSlug;
      existing.title = body.title;
    }

    if (typeof body.content === "string") existing.content = body.content;
    if (typeof body.summary === "string" || body.summary === undefined)
      existing.summary = body.summary;

    // 🟣 kategori: id de gelebilir, ad da gelebilir
    if (typeof body.categoryId === "string") {
      if (!Types.ObjectId.isValid(body.categoryId))
        return res.status(400).json({ message: "Geçersiz kategori ID" });
      const cat = await CategoryModel.findById(body.categoryId).lean();
      if (!cat) return res.status(404).json({ message: "Kategori bulunamadı" });
      existing.category = body.categoryId as any;
    } else if (typeof body.category === "string") {
      const cat = await CategoryModel.findOne({ name: body.category })
        .collation({ locale: "tr", strength: 2 })
        .lean();
      if (!cat) return res.status(404).json({ message: "Kategori bulunamadı" });
      existing.category = cat._id as any;
    }

    // keywords, readingMinutes
    if (Array.isArray(body.keywords)) existing.keywords = body.keywords;
    if (
      typeof body.readingMinutes === "number" ||
      body.readingMinutes === undefined
    )
      existing.readingMinutes = body.readingMinutes as any;

    // GÖRSEL
    if (req.file) {
      // tamamen yeni dosya → eskisini sil
      await destroyIfExists(existing.image?.publicId);
      const uploaded = await uploadToCloudinary(req.file);
      existing.image = {
        url: uploaded.url,
        alt: body.image?.alt ?? existing.image?.alt ?? "Kapak görseli",
        tinyUrl: uploaded.tinyUrl,
        publicId: uploaded.publicId,
      };
    } else if (body.image) {
      // body.image.url aynıysa, yeniden import etme
      if (
        body.image.url &&
        body.image.url !== existing.image?.url // ⬅️ gereksiz silmeyi engelle
      ) {
        await destroyIfExists(existing.image?.publicId);
        const imported = await importUrlToCloudinary(body.image.url);
        existing.image = {
          url: imported.url,
          alt: body.image.alt ?? existing.image?.alt ?? "Kapak görseli",
          tinyUrl: imported.tinyUrl,
          publicId: imported.publicId,
        };
      } else {
        // sadece alt / tiny değişiyorsa
        existing.image = {
          url: existing.image?.url!,
          alt: body.image.alt ?? existing.image?.alt ?? "Kapak görseli",
          tinyUrl: body.image.tinyUrl ?? existing.image?.tinyUrl,
          publicId: existing.image?.publicId,
        };
      }
    }

    await existing.save();
    const doc = await existing.populate("category", "name");
    return res.json(mapArticle(doc.toObject()));
  } catch (e) {
    next(e);
  }
}

/* -------------------------------- DELETE -------------------------------- */
export async function deleteArticle(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Geçersiz ID" });

    const doc = await ArticleModel.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Makale bulunamadı" });

    await destroyIfExists((doc as any).image?.publicId);

    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
