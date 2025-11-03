import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const IletisimSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
  },
  {
    versionKey: false,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

IletisimSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete (ret as any)._id;
    return ret;
  },
});

export type Iletisim = InferSchemaType<typeof IletisimSchema>;
export type IletisimDoc = HydratedDocument<Iletisim>;
export type IletisimDTO = Iletisim & { id: string };

// Koleksiyon adı artık sadece "iletisim"
export const IletisimModel = model<Iletisim>(
  "Iletisim",
  IletisimSchema,
  "iletisim"
);
