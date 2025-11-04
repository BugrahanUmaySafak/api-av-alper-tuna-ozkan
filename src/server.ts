// src/server.ts
import { app } from "./app.js";
import { ensureMongoose } from "./db/connect.js";

await ensureMongoose();

const port = Number(process.env.PORT ?? process.env.port ?? 4001);
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 API ready on http://0.0.0.0:${port}`);
});
