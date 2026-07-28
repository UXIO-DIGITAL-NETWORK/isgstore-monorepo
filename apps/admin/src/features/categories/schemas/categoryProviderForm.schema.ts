import { z } from "zod";

/** Add / Edit Category Provider — three required selects
 * (product_requirements.md §4.5, line 247). */
export const categoryProviderFormSchema = z.object({
  providerName: z.string().min(1, "Provider is required"),
  categoryId: z.string().min(1, "Category is required"),
  providerTemplate: z.string().min(1, "Provider Template is required"),
});

export type CategoryProviderFormValues = z.infer<typeof categoryProviderFormSchema>;
