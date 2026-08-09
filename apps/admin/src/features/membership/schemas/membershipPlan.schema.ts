import { z } from "zod";

/**
 * Membership plan form. Numeric inputs register with `valueAsNumber`, so the
 * schema takes real numbers (no native `min` on the inputs — Zod owns it, or the
 * browser constraint would block submit before validation runs).
 */
export const membershipPlanSchema = z.object({
  code: z.string().trim().min(1, "Code is required"),
  name: z.string().trim().min(1, "Name is required"),
  price: z.number({ message: "Enter a valid price" }).min(0, "Price cannot be negative"),
  duration_days: z.number({ message: "Enter a valid duration" }).min(1, "Duration must be at least 1 day"),
  is_active: z.boolean(),
});

export type MembershipPlanFormValues = z.infer<typeof membershipPlanSchema>;
