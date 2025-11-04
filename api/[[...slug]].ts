// api/[[...slug]].ts
import serverless from "serverless-http";
import { app } from "../src/app.js";
import { ensureMongoose } from "../src/db/connect.js";

let handler: any;

export default async function (req: any, res: any) {
  await ensureMongoose();
  handler ||= serverless(app);
  return handler(req, res);
}

export const config = { maxDuration: 10, memory: 1024 };
