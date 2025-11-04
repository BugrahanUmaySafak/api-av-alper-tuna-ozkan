import serverless from "serverless-http";
import { ensureMongoose } from "../src/db/connect.js";

let handler: any;

export default async function (req: any, res: any) {
  // Sağlık kontrolünü DB beklemeden döndür
  if (req.url?.startsWith("/api/health") || req.url?.startsWith("/health")) {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (!handler) {
    await ensureMongoose();
    const { app } = await import("../src/app.js"); // lazy import
    handler = serverless(app);
  }
  return handler(req, res);
}

export const config = { maxDuration: 10, memory: 1024 };
