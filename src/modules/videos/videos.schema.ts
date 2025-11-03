// src/modules/videos/videos.schema.ts
import { z } from "zod";

const youtubeIdRegex = /^[a-zA-Z0-9_-]{6,}$/;

export const videoSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  youtubeId: z.string().regex(youtubeIdRegex, "Geçerli bir YouTube ID giriniz"),

  // panelden select ile geliyor
  categoryId: z.string().optional().nullable(),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type VideoSchema = z.infer<typeof videoSchema>;
