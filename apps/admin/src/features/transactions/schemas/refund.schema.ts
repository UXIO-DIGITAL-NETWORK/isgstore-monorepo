import { z } from "zod";

/**
 * Refund row action (product_requirements.md §4.3 — "initiate a refund with a
 * confirmation + reason"). The reason is mandatory: the service rejects an
 * empty string (transactions.service.ts refund()), so the form gate must catch
 * it before the mutation ever fires.
 */
export const refundSchema = z.object({
  reason: z.string().trim().min(1, "A refund reason is required"),
});

export type RefundFormValues = z.infer<typeof refundSchema>;
