// src/modules/videos/types.ts

import type { Category } from "../category/types.js";

export type Video = {
  id: string;
  title: string;
  youtubeId: string;
  createdAt: string;
  updatedAt?: string;
  coverUrl?: string;
  coverPublicId?: string;
  category?: Category;
};
