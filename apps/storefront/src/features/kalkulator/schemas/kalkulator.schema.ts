import { z } from "zod";

export const winRateSchema = z.object({
  totalMatch: z
    .number({ message: "validation.totalMatchRequired" })
    .int({ message: "validation.totalMatchInteger" })
    .min(1, { message: "validation.totalMatchMin" }),
  currentWR: z
    .number({ message: "validation.wrRequired" })
    .min(0, { message: "validation.wrRange" })
    .max(100, { message: "validation.wrRange" }),
  targetWR: z
    .number({ message: "validation.wrRequired" })
    .min(0, { message: "validation.wrRange" })
    .max(100, { message: "validation.wrRange" }),
});

export type WinRateFormData = z.infer<typeof winRateSchema>;
