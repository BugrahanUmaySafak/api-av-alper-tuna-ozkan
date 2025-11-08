// src/modules/article/article.controller.ts
import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import cloudinary from "../../config/cloudinary.js"; // ⬅️ kendi config’in
import { ArticleModel } from "./article.model.js";
import { articleSchema, articleUpdateSchema } from "./article.schema.js";
import { slugify } from "../../utils/slugifyTR.js";
import { CategoryModel } from "../category/category.model.js";
import {
  tinyBlurCloudinary,
  tinyBlurFillCloudinary,
  noCropFitCloudinary,
  chooseNoCropUnder1MB,
} from "../../utils/cloudinaryUrl.js";

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

async function normalizeImagePayload(
  image: {
    url: string;
    alt?: string;
    tinyUrl?: string;
    publicId: string;
  },
  fallbackAlt?: string
) {
  const optimizedUrl =
    (await chooseNoCropUnder1MB(
      image.url,
      [1920, 1600],
      ["auto:eco", "auto:low", 60]
    )) ?? noCropFitCloudinary(image.url, { w: 1600 }) ?? image.url;

  const derivedTiny =
    image.tinyUrl ??
    tinyBlurCloudinary(image.url) ??
    tinyBlurFillCloudinary(image.url, { fillWidth: 1600 }) ??
    image.url;

  return {
    url: optimizedUrl,
    alt: image.alt ?? fallbackAlt ?? "Kapak görseli",
    tinyUrl: derivedTiny,
    publicId: image.publicId,
  };
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
      publicId: doc?.image?.publicId ?? undefined,
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

    if (!body.image?.url || !body.image?.publicId) {
      return res
        .status(400)
        .json({ message: "Cloudinary url ve publicId zorunludur." });
    }

    const normalizedImage = await normalizeImagePayload(body.image, body.image.alt);

    const created = await ArticleModel.create({
      title: body.title,
      slug: uniqueSlug,
      content: body.content,
      image: normalizedImage,
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

    const raw = parseIncomingBody(req);
    const parsed = articleUpdateSchema.safeParse(raw);
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
    if (body.image) {
      const wantsNewAsset =
        typeof body.image.url === "string" &&
        typeof body.image.publicId === "string";

      const alt =
        body.image.alt ??
        existing.image?.alt ??
        body.title ??
        existing.title ??
        "Kapak görseli";

      if (wantsNewAsset) {
        if (
          existing.image?.publicId &&
          body.image.publicId !== existing.image.publicId
        ) {
          await destroyIfExists(existing.image.publicId);
        }

        existing.image = await normalizeImagePayload(
          {
            url: body.image.url!,
            alt,
            tinyUrl: body.image.tinyUrl,
            publicId: body.image.publicId!,
          },
          alt
        );
      } else {
        existing.image = {
          url: existing.image?.url ?? "",
          alt,
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
