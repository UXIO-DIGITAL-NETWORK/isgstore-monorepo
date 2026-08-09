import { z } from "zod";

/**
 * Role markup rule. Numeric inputs register with `valueAsNumber` (no native
 * `min` — Zod owns the bounds, or the browser would block submit before
 * validation runs). An empty `category_id` means the global fallback rule.
 */
export const pricingRuleSchema = z.object({
  category_id: z.string(),
  role: z.enum(["member", "vip", "reseller", "agent"]),
  markup_percent: z
    .number({ message: "Enter a valid percentage" })
    .min(0, "Cannot be negative")
    .max(1000, "Cannot exceed 1000"),
  markup_flat: z.number({ message: "Enter a valid amount" }).min(0, "Cannot be negative"),
});

export type PricingRuleFormValues = z.infer<typeof pricingRuleSchema>;
