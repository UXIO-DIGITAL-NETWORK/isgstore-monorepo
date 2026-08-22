import { z } from "zod";

/** Digit-string price, matching the Main Product form's price convention. */
const priceField = z
  .string()
  .min(1, "Required")
  .regex(/^\d+$/, "Numbers only");

/**
 * Add-from-Uxiotopup form. A category is mandatory — the backend never guesses
 * one — and the four tier prices are pre-filled from the SKU's suggested prices
 * but remain the admin's decision.
 */
export const providerAddSchema = z.object({
  category_id: z.string().min(1, "Choose a category"),
  sub_category_id: z.string().optional(),
  name: z.string().optional(),
  price_member: priceField,
  price_vip: priceField,
  price_reseller: priceField,
  price_agent: priceField,
  status: z.boolean(),
});

export type ProviderAddFormValues = z.infer<typeof providerAddSchema>;
