// src/modules/article/article.schema.ts
import { z } from "zod";

const imageSchema = z.object({
  url: z
    .string()
    .url("Cloudinary secure_url değeri gereklidir")
    .min(1, "Görsel URL'i zorunludur"),
  alt: z.string().min(3, "Görsel açıklaması en az 3 karakter olmalıdır"),
  tinyUrl: z.string().url().optional(),
  publicId: z.string().min(3, "Cloudinary public_id zorunludur"),
});

const baseArticleSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  content: z.string().min(10, "İçerik en az 10 karakter olmalıdır"),

  slug: z
    .string()
    .min(3, "Slug en az 3 karakter olmalıdır")
    .regex(/^[a-z0-9-]+$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir")
    .optional(),

  image: imageSchema,

  summary: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  keywords: z.array(z.string()).optional().default([]),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  readingMinutes: z.number().int().positive().optional(),
});

export const articleSchema = baseArticleSchema;

const imageUpdateSchema = imageSchema.partial().superRefine((img, ctx) => {
  if (!img) return;
  const hasUrl = typeof img.url === "string";
  const hasPublicId = typeof img.publicId === "string";
  if (hasUrl !== hasPublicId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Yeni görsel için hem url hem publicId gönderilmelidir.",
    });
  }
});

export const articleUpdateSchema = baseArticleSchema.partial().extend({
  image: imageUpdateSchema.optional(),
});

export type ArticleSchema = z.infer<typeof articleSchema>;
export type ArticleUpdateSchema = z.infer<typeof articleUpdateSchema>;
