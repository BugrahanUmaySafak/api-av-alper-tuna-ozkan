// api/[[...slug]].ts
import serverless from "serverless-http";
import { app } from "../src/app.js";
import { ensureMongoose } from "../src/db/connect.js";

let handler: any;

export default async function (req: any, res: any) {
  if (req.url === "/api/health" || req.url === "/health") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  await ensureMongoose();
  handler ||= serverless(app);
  return handler(req, res);
}

export const config = { maxDuration: 10, memory: 1024 };
