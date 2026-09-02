import { z } from "zod";

/**
 * Markup rule. Numeric inputs register with `valueAsNumber` (no native `min` —
 * Zod owns the bounds, or the browser would block submit before validation
 * runs).
 *
 * Both selects carry a sentinel rather than an enum: an empty `category_id`
 * means every category, an empty `membership_plan_id` means every plan. The
 * plan list is data, so it cannot be a `z.enum` — validating against a fixed
 * set is exactly the cap this release removes.
 */
export const pricingRuleSchema = z.object({
  category_id: z.string(),
  membership_plan_id: z.string(),
  markup_percent: z
    .number({ message: "Enter a valid percentage" })
    .min(0, "Cannot be negative")
    .max(1000, "Cannot exceed 1000"),
  markup_flat: z.number({ message: "Enter a valid amount" }).min(0, "Cannot be negative"),
});

export type PricingRuleFormValues = z.infer<typeof pricingRuleSchema>;
