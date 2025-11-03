// src/modules/article/article.schema.ts
import { z } from "zod";

export const articleSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  content: z.string().min(10, "İçerik en az 10 karakter olmalıdır"),

  // frontend bazen slug gönderiyor, bazen göndermiyor
  slug: z
    .string()
    .min(3, "Slug en az 3 karakter olmalıdır")
    .regex(/^[a-z0-9-]+$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir")
    .optional(),

  // 🟣 panel bazen sadece alt gönderiyor (file gelecek)
  image: z
    .object({
      url: z.string().url().or(z.literal("")).optional(),
      alt: z.string().min(3, "Görsel açıklaması en az 3 karakter olmalıdır"),
      tinyUrl: z.string().url().optional(),
    })
    .optional(),

  summary: z.string().optional(),

  // 🟣 senin panelin bazen kategori ADI gönderiyor: { category: "Gayrimenkul" }
  category: z.string().optional(),

  // 🟣 bazen de kategori ID’si gönderiyor: { categoryId: "676..." }
  categoryId: z.string().optional(),

  keywords: z.array(z.string()).optional().default([]),

  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),

  readingMinutes: z.number().int().positive().optional(),
});

export type ArticleSchema = z.infer<typeof articleSchema>;
