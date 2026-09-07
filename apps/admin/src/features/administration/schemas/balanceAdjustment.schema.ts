import { z } from "zod";

/**
 * Manual wallet adjustment (PRD §5 — user wallet management). The amount input
 * registers with `valueAsNumber`, so the schema takes a real number (the repo
 * convention — `z.coerce.number()` types its input as `unknown` and breaks the
 * resolver's field-error mapping). A reason is mandatory because the write is
 * audited.
 */
export const balanceAdjustmentSchema = z.object({
  direction: z.enum(["credit", "debit"]),
  amount: z.number({ message: "Enter a valid amount" }).min(1, "Amount must be greater than zero"),
  reason: z.string().trim().min(1, "A reason is required"),
});

export type BalanceAdjustmentFormValues = z.infer<typeof balanceAdjustmentSchema>;
