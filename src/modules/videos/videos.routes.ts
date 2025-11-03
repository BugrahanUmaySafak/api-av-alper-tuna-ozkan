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

videosRouter.get("/", listVideos);
videosRouter.post("/", createVideo);
videosRouter.get("/:id", getVideoById);
videosRouter.patch("/:id", updateVideo);
videosRouter.delete("/:id", deleteVideo);
