// src/modules/auth/auth.controller.ts
import type { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "./user.model.js";

const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: "missing_fields" });

  const { username, password } = parsed.data;
  const user = await User.findOne({ username }).lean();
  if (!user) return res.status(401).json({ message: "invalid_credentials" });

  const ok = await bcrypt.compare(password, (user as any).passwordHash);
  if (!ok) return res.status(401).json({ message: "invalid_credentials" });

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ message: "session_error" });
    req.session.userId = String((user as any)._id);
    req.session.username = (user as any).username;
    return res.json({ ok: true, user: { username: (user as any).username } });
  });
}

export async function logout(req: Request, res: Response) {
  req.session.destroy(() => {
    res.clearCookie("sid", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      domain:
        process.env.NODE_ENV === "production"
          ? ".alpertunaozkan.com"
          : undefined, // <-- eklendi
    });
    res.json({ ok: true });
  });
}
export async function me(req: Request, res: Response) {
  if (req.session?.userId) {
    return res.json({ ok: true, user: { username: req.session.username } });
  }
  return res.status(401).json({ ok: false });
}

export async function protectedExample(_req: Request, res: Response) {
  return res.json({ ok: true, data: "secret-panel-data" });
}
