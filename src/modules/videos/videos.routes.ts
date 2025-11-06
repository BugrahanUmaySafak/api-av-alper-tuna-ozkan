// src/modules/videos/videos.routes.ts
import { Router } from "express";
import {
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  getVideoById,
} from "./videos.controller.js";
import { requireAuth } from "../../middlewares/requireAuth.js";

export const videosRouter = Router();

/* Public (ANA SİTE) */
videosRouter.get("/", listVideos);
videosRouter.get("/:id", getVideoById);

/* Panel (AUTH ZORUNLU) */
videosRouter.post("/", requireAuth, createVideo);
videosRouter.patch("/:id", requireAuth, updateVideo);
videosRouter.delete("/:id", requireAuth, deleteVideo);
