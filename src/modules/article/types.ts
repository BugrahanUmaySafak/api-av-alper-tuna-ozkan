// src/modules/article/types.ts
import type { Category } from "../category/types.ts";

export type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  image: {
    url: string;
    alt: string;
    tinyUrl?: string;
    publicId?: string;
  };
  summary?: string;
  category?: Category;
  keywords: string[];
  publishedAt: string; // createdAt ISO
  updatedAt?: string; // updatedAt ISO
  readingMinutes?: number;
};
