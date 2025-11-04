// src/modules/category/category.model.ts
import { Schema, model, type InferSchemaType } from "mongoose";

const CategorySchema = new Schema(
  {
    // ⚠️ burada unique YOK, sadece trim
    name: { type: String, required: true, trim: true },
  },
  {
    versionKey: false,
    collection: "kategoriler",
    timestamps: true,
  }
);

// ✅ tek unique index burada
CategorySchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: "tr", strength: 2 },
  }
);

// isimleri normalize et (tek boşluk)
CategorySchema.pre("validate", function (next) {
  if (typeof (this as any).name === "string") {
    (this as any).name = (this as any).name.trim().replace(/\s+/g, " ");
  }
  next();
});

export type Category = InferSchemaType<typeof CategorySchema>;

export const CategoryModel = model<Category>(
  "Category",
  CategorySchema,
  "kategoriler"
);
