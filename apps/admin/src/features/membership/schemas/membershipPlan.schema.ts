import { z } from "zod";

/**
 * Membership plan form. Numeric inputs register with `valueAsNumber`, so the
 * schema takes real numbers (no native `min` on the inputs — Zod owns it, or the
 * browser constraint would block submit before validation runs).
 *
 * `is_lifetime` is form-only state: the API models "never expires" as
 * `duration_days: null`, so the checkbox drives the value rather than being sent
 * alongside it. A lifetime plan skips the duration check entirely — a disabled
 * input reports NaN through `valueAsNumber`, which would otherwise fail
 * validation on a field the user cannot reach.
 */
export const membershipPlanSchema = z
  .object({
    code: z.string().trim().min(1, "Code is required"),
    name: z.string().trim().min(1, "Name is required"),
    price: z.number({ message: "Enter a valid price" }).min(0, "Price cannot be negative"),
    is_lifetime: z.boolean(),
    duration_days: z.number().nullable(),
    is_active: z.boolean(),
  })
  .refine((values) => values.is_lifetime || (values.duration_days !== null && values.duration_days >= 1), {
    path: ["duration_days"],
    message: "Duration must be at least 1 day",
  });

export type MembershipPlanFormValues = z.infer<typeof membershipPlanSchema>;
