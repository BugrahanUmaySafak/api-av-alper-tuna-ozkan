// src/modules/contact/contact.routes.ts
import { Router } from "express";
import {
  createIletisim,
  listIletisim,
  deleteIletisim,
} from "./contact.controller.js";
import { requireAuth } from "../../middlewares/requireAuth.js";

export const contactRouter = Router();

/* Ana site: sadece POST /iletisim public */
contactRouter.post("/", createIletisim);

/* Panel (AUTH ZORUNLU) */
contactRouter.get("/", requireAuth, listIletisim);
contactRouter.delete("/:id", requireAuth, deleteIletisim);
