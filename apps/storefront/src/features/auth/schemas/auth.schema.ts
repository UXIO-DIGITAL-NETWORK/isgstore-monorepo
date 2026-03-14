import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["password_confirmation"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
