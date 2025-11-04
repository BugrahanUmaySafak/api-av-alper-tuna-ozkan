// api/[[...slug]].ts
import type { IncomingMessage, ServerResponse } from "node:http";

export default async function handler(
  req: IncomingMessage & { url?: string },
  res: ServerResponse
) {
  const url = req.url || "/";

  if (url.startsWith("/api/health") || url.startsWith("/health")) {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  const { ensureMongoose } = await import("../src/db/connect.js");
  const { app } = await import("../src/app.js");

  await ensureMongoose();
  return (app as any)(req as any, res as any);
}

export const config = { maxDuration: 10 };
