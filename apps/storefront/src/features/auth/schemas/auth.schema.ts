import { z } from "zod";

import { E164_PATTERN, normalizeWhatsappNumber } from "@/lib/phone";

export const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    username: z.string().min(3, "Username minimal 3 karakter"),
    email: z.email("Format email tidak valid"),
    // Validated against the canonical form the page actually submits, not the
    // raw field: the input shows "0812…" while the request carries "+62812…",
    // and testing the regex on the visible text would reject every local number.
    // The rule itself is the API's, so client and server agree on the verdict.
    phone: z.string().refine((value) => E164_PATTERN.test(normalizeWhatsappNumber(value)), "Nomor WhatsApp tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["password_confirmation"],
  });

export const forgotPasswordSchema = z.object({
  email: z.email("Format email tidak valid"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
