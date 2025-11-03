// src/modules/videos/videos.model.ts
import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
  Types,
} from "mongoose";

const VideoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    youtubeId: { type: String, required: true, trim: true },

    // Cloudinary
    coverUrl: { type: String, default: "" },
    coverPublicId: { type: String, default: "" },

    // kategori (populate edilebilir)
    category: { type: Types.ObjectId, ref: "Category" },
  },
  {
    versionKey: false,
    collection: "videolarim",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

VideoSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = (ret as any)._id?.toString();
    delete (ret as any)._id;
    return ret;
  },
});

export type Video = InferSchemaType<typeof VideoSchema>;
export type VideoDoc = HydratedDocument<Video>;

export const VideoModel = model<Video>("Video", VideoSchema, "videolarim");
