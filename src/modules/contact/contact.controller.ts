// src/modules/contact/contact.controller.ts
import type { Request, Response, NextFunction } from "express";
import { contactSchema } from "./contact.schema.js";
import { IletisimModel } from "./contact.model.js";
import { Types } from "mongoose";
import type { Contact } from "./types.ts";

function mapContact(doc: any): Contact {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email ?? null,
    phone: doc.phone ?? null,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt?.toISOString?.(),
  };
}

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
    const fresh = await IletisimModel.findById(doc._id).lean();
    return res.status(201).json(mapContact(fresh ?? doc));
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
    const items = await IletisimModel.find()
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ items: items.map(mapContact) });
  } catch (err) {
    next(err);
  }
}

export async function getIletisimById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Geçersiz ID" });
    }
    const doc = await IletisimModel.findById(id).lean();
    if (!doc) return res.status(404).json({ message: "Kayıt bulunamadı" });
    return res.json(mapContact(doc));
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
    const doc = await IletisimModel.findByIdAndDelete(id).lean();
    if (!doc) return res.status(404).json({ message: "Kayıt bulunamadı" });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
