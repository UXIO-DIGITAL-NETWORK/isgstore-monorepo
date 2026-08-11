import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  remember: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
