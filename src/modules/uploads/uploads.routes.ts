// src/modules/uploads/uploads.routes.ts
import { Router } from "express";
import { createSignedUpload } from "./uploads.controller.js";

export const uploadsRouter = Router();

uploadsRouter.post("/signature", createSignedUpload);
