import { z } from "zod";

/** Add / Edit Category Provider — three required selects
 * (product_requirements.md §4.5, line 247). */
export const categoryProviderFormSchema = z.object({
  // The API stores this as a supplier_id foreign key, so the select's
  // value is an id, not the display name.
  supplierId: z.string().min(1, "Provider is required"),
  categoryId: z.string().min(1, "Category is required"),
  providerCategory: z.string().min(1, "Provider Category is required"),
});

export type CategoryProviderFormValues = z.infer<typeof categoryProviderFormSchema>;
