// src/server.ts
import http from "node:http";
import { app } from "./app.js";
import { ensureMongoose } from "./db/connect.js";
import mongoose from "mongoose";

try {
  await ensureMongoose();
} catch (err) {
  console.error("❌ MongoDB bağlantı hatası:", err);
  process.exit(1);
}

const port = Number(process.env.PORT ?? 4001);
const host = "0.0.0.0";

const server = http.createServer(app);

server.listen(port, host, () => {
  console.log(`🚀 API ready on http://${host}:${port}`);
  console.log(`🔧 NODE_ENV=${process.env.NODE_ENV || "development"}`);
});

const shutdown = (signal: string) => {
  console.log(`\n↩️  ${signal} alındı, sunucu kapatılıyor...`);
  server.close(async (err) => {
    if (err) {
      console.error("Sunucu kapatılırken hata:", err);
      process.exit(1);
    }
    try {
      await mongoose.connection.close(); // ← callback yok, 0-1 argüman
      console.log("✅ Mongo bağlantısı kapatıldı.");
    } catch (e) {
      console.error("Mongo kapatılırken hata:", e);
    } finally {
      process.exit(0);
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  // İstersen burada da kontrollü çıkış yapabilirsin
});
