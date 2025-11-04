// api/[[...slug]].ts
import serverless from "serverless-http";
import { ensureMongoose } from "../src/db/connect.js";

let handler: any; // cache

export default async function (req: any, res: any) {
  // ✅ Health: DB beklemeden yanıtla
  if (req.url?.startsWith("/api/health") || req.url?.startsWith("/health")) {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Lazy import + DB bağlantısı sadece ihtiyaç olunca
  if (!handler) {
    await ensureMongoose();
    const { app } = await import("../src/app.js");
    handler = serverless(app);
  }
  return handler(req, res);
}

export const config = { maxDuration: 10, memory: 1024 };
