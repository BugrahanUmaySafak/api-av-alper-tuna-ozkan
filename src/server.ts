import { app } from "./app.js";
import { connectDB } from "./db/connect.js";
import { env } from "./config/env.js";

await connectDB();

app.listen(env.port, () => {
  console.log(`🚀 API ready on http://localhost:${env.port}`);
});
