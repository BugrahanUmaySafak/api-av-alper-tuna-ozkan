// src/modules/auth/auth.model.ts
import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, unique: true, required: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = model("User", userSchema);

// TS tip çıkarımı (runtime’ı etkilemez)
export type UserDoc = InferSchemaType<typeof userSchema>;
