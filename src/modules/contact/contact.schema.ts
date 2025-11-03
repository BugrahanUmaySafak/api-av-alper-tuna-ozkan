// src/modules/contact/contact.schema.ts
import { z } from "zod";

export const contactSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Lütfen adınızı ve soyadınızı girin" })
      .max(100, { message: "Ad soyad en fazla 50 karakter olabilir" }), // formdaki mesajı birebir koruduk
    email: z
      .string()
      .email({ message: "Lütfen geçerli bir e-posta adresi girin" })
      .or(z.literal(""))
      .optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{7,15}$/, {
        message: "Lütfen geçerli bir telefon numarası girin",
      })
      .or(z.literal(""))
      .optional(),
    title: z
      .string()
      .min(10, { message: "Konunuz en az 10 karakter olmalıdır" })
      .max(200, { message: "Konunuz en fazla 200 karakter olabilir" }),
    content: z
      .string()
      .min(10, { message: "Mesajınız en az 10 karakter olmalıdır" })
      .max(2000, { message: "Mesajınız en fazla 2000 karakter olabilir" }),
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone) {
      const msg =
        "Lütfen e-posta adresi veya telefon numarasından en az birini girin";
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: ["email"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: ["phone"],
      });
    }
  });

export type ContactSchema = z.infer<typeof contactSchema>;
