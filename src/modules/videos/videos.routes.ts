// src/modules/videos/videos.routes.ts
import { Router } from "express";
import {
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  getVideoById,
} from "./videos.controller.js";

export const videosRouter = Router();

/* Public (ANA SİTE) */
videosRouter.get("/", listVideos);
videosRouter.get("/:id", getVideoById);

videosRouter.post("/", createVideo);
videosRouter.patch("/:id", updateVideo);
videosRouter.delete("/:id", deleteVideo);
