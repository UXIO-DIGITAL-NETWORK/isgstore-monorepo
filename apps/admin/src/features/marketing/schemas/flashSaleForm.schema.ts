import { z } from "zod";

/**
 * Numeric inputs register with `valueAsNumber`, so the schema takes real
 * numbers — `z.coerce.number()` types its input as `unknown` and breaks
 * react-hook-form's resolver generic.
 */
export const flashSaleFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    startsAt: z.string().min(1, "Start is required"),
    endsAt: z.string().min(1, "End is required"),
    isActive: z.boolean(),
    items: z.array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        salePrice: z.number().int().min(0, "Sale price cannot be negative"),
        stockTotal: z.number().int().min(0),
      }),
    ),
  })
  .refine((values) => values.endsAt > values.startsAt, {
    message: "The end must be after the start",
    path: ["endsAt"],
  });

export type FlashSaleFormValues = z.infer<typeof flashSaleFormSchema>;
