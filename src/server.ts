// src/server.ts

import { app } from "./app.js";
import { connectDB } from "./db/connect.js";

await connectDB();

const port = Number(process.env.PORT ?? process.env.port ?? 4001);
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 API ready on http://0.0.0.0:${port}`);
});
  