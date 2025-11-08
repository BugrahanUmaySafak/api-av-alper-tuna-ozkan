// src/modules/videos/types.ts
import type { Category } from "../category/types.js";

export type CategoryRef = Category;

export type Video = {
  id: string;
  title: string;
  youtubeId: string;
  category?: CategoryRef;
};

export type VideoList = {
  items: Video[];
};
