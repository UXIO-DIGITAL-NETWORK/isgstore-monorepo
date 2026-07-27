import { z } from "zod";

// §4.5 line 210: this form's Logo accepts one more format than the Category
// feature's own logo field — WEBP is deliberate here, not a copy-paste slip.
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, per system_architecture.md §4.9

/** Description live-counter cap (§4.5) — same 280 as Category's Meta
 * Description, and the percentage is derived from it rather than mocked. */
export const DESCRIPTION_MAX = 280;

/** Add / Edit Sub Category form — product_requirements.md §4.5. */
export const subCategoryFormSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Sub Category Name is required"),
  currencyName: z.string().min(1, "Currency Name is required"),
  logo: z
    .instanceof(File)
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "Only JPG, JPEG, PNG, or WEBP files are allowed")
    .refine((file) => file.size <= MAX_IMAGE_SIZE_BYTES, "File must be 10MB or smaller")
    .optional(),
  description: z.string().max(DESCRIPTION_MAX).optional(),
});

export type SubCategoryFormValues = z.infer<typeof subCategoryFormSchema>;
