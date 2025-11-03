// src/modules/article/article.model.ts
import { Schema, model, Types } from "mongoose";

const ImageSub = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true, trim: true },
    tinyUrl: { type: String },
    publicId: { type: String, trim: true },
  },
  { _id: false }
);

const ArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    content: { type: String, required: true },
    image: { type: ImageSub, required: true },
    summary: { type: String, trim: true },
    // tek kategori
    category: { type: Types.ObjectId, ref: "Category" },
    keywords: { type: [String], default: [] },
    readingMinutes: { type: Number },
  },
  {
    versionKey: false,
    collection: "makalelerim",
    timestamps: true, // createdAt / updatedAt
  }
);

// ✅ Duplicate index uyarısı olmasın diye SADECE burada
ArticleSchema.index(
  { slug: 1 },
  { unique: true, collation: { locale: "tr", strength: 2 } }
);

ArticleSchema.pre("validate", function (next) {
  if (typeof this.title === "string") {
    this.title = this.title.trim().replace(/\s+/g, " ");
  }
  next();
});

export const ArticleModel = model("Article", ArticleSchema, "makalelerim");
