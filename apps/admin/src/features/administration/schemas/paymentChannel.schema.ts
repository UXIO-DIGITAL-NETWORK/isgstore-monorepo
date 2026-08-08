import { z } from "zod";

/**
 * Payment-channel fee configuration (PRD §5). Numeric inputs register with
 * `valueAsNumber`, so the schema takes real numbers. A flat fee and minimum are
 * non-negative amounts; the percentage fee is 0–100.
 */
export const paymentChannelSchema = z.object({
  fee_flat: z.number({ message: "Enter a valid fee" }).min(0, "Fee cannot be negative"),
  fee_percent: z
    .number({ message: "Enter a valid percentage" })
    .min(0, "Percentage cannot be negative")
    .max(100, "Percentage cannot exceed 100"),
  min_amount: z.number({ message: "Enter a valid amount" }).min(0, "Minimum cannot be negative"),
});

export type PaymentChannelFormValues = z.infer<typeof paymentChannelSchema>;
