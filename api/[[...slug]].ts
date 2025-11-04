// api/[[...slug]].ts
import type { IncomingMessage, ServerResponse } from "node:http";
import { ensureMongoose } from "../src/db/connect.js";
import { app } from "../src/app.js";

export default async function handler(
  req: IncomingMessage & { url?: string },
  res: ServerResponse
) {
  // Health: DB beklemeden hemen dön
  if (req.url?.startsWith("/api/health") || req.url?.startsWith("/health")) {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // İlk gerçek istekten önce DB bağlantısını kur
  await ensureMongoose();

  // Express uygulamasını doğrudan çalıştır
  return app(req as any, res as any);
}

export const config = { maxDuration: 10, memory: 1024 };
