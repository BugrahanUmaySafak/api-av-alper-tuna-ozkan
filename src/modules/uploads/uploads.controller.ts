// src/modules/uploads/uploads.controller.ts
import type { Request, Response, NextFunction } from "express";
import cloudinary from "../../config/cloudinary.js";
import { env } from "../../config/env.js";

const PUBLIC_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

const UPLOAD_TARGETS = {
  article: {
    folder: env.cloudinary.articleFolder || "articles",
    resourceType: "image" as const,
    uploadPreset: env.cloudinary.articleUploadPreset || undefined,
  },
};

type UploadTargetKey = keyof typeof UPLOAD_TARGETS;

export async function createSignedUpload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body ?? {};
    const target: UploadTargetKey =
      typeof body?.target === "string" && body.target in UPLOAD_TARGETS
        ? (body.target as UploadTargetKey)
        : "article";

    const targetConfig = UPLOAD_TARGETS[target];

    if (!env.cloudinary.apiSecret || !env.cloudinary.apiKey) {
      return res
        .status(500)
        .json({ message: "Cloudinary kimlik bilgileri eksik." });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder: targetConfig.folder,
    };

    if (targetConfig.uploadPreset) {
      paramsToSign.upload_preset = targetConfig.uploadPreset;
    }

    if (body?.publicId !== undefined) {
      if (
        typeof body.publicId !== "string" ||
        !PUBLIC_ID_REGEX.test(body.publicId)
      ) {
        return res.status(400).json({ message: "Geçersiz publicId formatı" });
      }
      paramsToSign.public_id = body.publicId;
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      env.cloudinary.apiSecret
    );

    return res.json({
      cloudName: env.cloudinary.cloudName,
      apiKey: env.cloudinary.apiKey,
      timestamp,
      signature,
      folder: targetConfig.folder,
      resourceType: targetConfig.resourceType,
      uploadPreset: targetConfig.uploadPreset,
      publicId: paramsToSign.public_id,
      target,
    });
  } catch (err) {
    next(err);
  }
}
