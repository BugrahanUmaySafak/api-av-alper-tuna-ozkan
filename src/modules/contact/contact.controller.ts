// src/modules/contact/contact.controller.ts
import type { Request, Response, NextFunction } from "express";
import { contactSchema } from "./contact.schema.js";
import { IletisimModel } from "./contact.model.js";
import { Types } from "mongoose";

// POST /api/contact
export async function createIletisim(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }
    const doc = await IletisimModel.create(parsed.data);
    return res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

// GET /api/contact
export async function listIletisim(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const items = await IletisimModel.find().sort({ createdAt: -1 }).lean();
    return res.json({ items });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/contact/:id
export async function deleteIletisim(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Geçersiz ID" });
    }
    const doc = await IletisimModel.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Kayıt bulunamadı" });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
