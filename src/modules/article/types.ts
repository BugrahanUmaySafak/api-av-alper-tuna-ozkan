// src/modules/article/types.ts
export type CategoryRef = { id: string; name: string };

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
  category?: CategoryRef;
  keywords: string[];
  readingMinutes?: number;
  publishedAt?: string;
  updatedAt?: string;
};

export type ArticleList = {
  items: Article[];
};
