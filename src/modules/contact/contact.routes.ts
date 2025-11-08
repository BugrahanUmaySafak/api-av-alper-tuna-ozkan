// src/modules/contact/contact.routes.ts
import { Router } from "express";
import {
  createIletisim,
  listIletisim,
  deleteIletisim,
  getIletisimById,
} from "./contact.controller.js";

export const contactRouter = Router();

contactRouter.post("/", createIletisim);
contactRouter.get("/", listIletisim);
contactRouter.get("/:id", getIletisimById);
contactRouter.delete("/:id", deleteIletisim);
