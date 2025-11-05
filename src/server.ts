import { app } from "./app.js";
import { ensureMongoose } from "./db/connect.js";

await ensureMongoose();

const port = Number(process.env.PORT ?? 4001);
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 API ready on http://0.0.0.0:${port}`);
});
