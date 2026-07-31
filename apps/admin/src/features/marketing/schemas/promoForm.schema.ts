import { z } from "zod";

/**
 * Numeric inputs register with `valueAsNumber`, so the schema takes real
 * numbers — `z.coerce.number()` types its input as `unknown` and breaks
 * react-hook-form's resolver generic.
 */
export const promoFormSchema = z
  .object({
    code: z
      .string()
      .min(1, "Code is required")
      .regex(/^[A-Z0-9]+$/, "Use uppercase letters and numbers only"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    type: z.enum(["percentage", "fixed"]),
    value: z.number().int().min(1, "Value must be at least 1"),
    maxDiscount: z.number().int().min(0).optional(),
    minPurchase: z.number().int().min(0),
    quotaTotal: z.number().int().min(0).optional(),
    quotaPerUser: z.number().int().min(0).optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    isPublic: z.boolean(),
    isActive: z.boolean(),
  })
  // A percentage over 100 would pay the customer to order, so it is caught
  // here as well as server-side.
  .refine((values) => values.type !== "percentage" || values.value <= 100, {
    message: "A percentage discount cannot exceed 100",
    path: ["value"],
  })
  .refine((values) => !values.startsAt || !values.endsAt || values.endsAt >= values.startsAt, {
    message: "The end date must be on or after the start date",
    path: ["endsAt"],
  });

export type PromoFormValues = z.infer<typeof promoFormSchema>;
