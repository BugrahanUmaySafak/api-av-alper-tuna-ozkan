import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, protectedExample } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/requireAuth.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/login", loginLimiter, login);
authRouter.post("/logout", logout);
authRouter.get("/me", me);
authRouter.get("/protected", requireAuth, protectedExample);
