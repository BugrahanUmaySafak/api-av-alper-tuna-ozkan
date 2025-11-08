// src/modules/uploads/uploads.routes.ts
import { Router } from "express";
import { createSignedUpload } from "./uploads.controller.js";
import { requireAuth } from "../../middlewares/requireAuth.js";

export const uploadsRouter = Router();

uploadsRouter.post("/signature", requireAuth, createSignedUpload);
