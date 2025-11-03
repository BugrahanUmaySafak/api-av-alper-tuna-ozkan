import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalı"),
});

export type CategorySchema = z.infer<typeof categorySchema>;
