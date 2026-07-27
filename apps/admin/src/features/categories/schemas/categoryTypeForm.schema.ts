import { z } from "zod";

/** Add / Edit Category Type form — product_requirements.md §4.5. Two fields
 * only; no logo or description on this tab. */
export const categoryTypeFormSchema = z.object({
  name: z.string().min(1, "Category Type Name is required"),
  isVoucher: z.boolean(),
});

export type CategoryTypeFormValues = z.infer<typeof categoryTypeFormSchema>;
