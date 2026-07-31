import { z } from "zod";

// Same upload constraints as the Category form, plus WEBP — the frame's
// dropzone caption reads "JPG, JPEG, PNG, WEBP up to 10mb".
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, per system_architecture.md §4.9

/** Description live-counter cap, as the frame's "0/280 characters" shows. */
export const DESCRIPTION_MAX = 280;

/**
 * Add Main Products form — product_requirements.md §4.6, following the
 * reference's field set exactly.
 *
 * Required is inferred: the frame marks nothing, so it is the three fields a
 * product cannot exist without (name, code, and the category it is filed
 * under). Everything else is optional rather than invented as mandatory.
 */
export const productFormSchema = z.object({
  name: z.string().min(1, "Product Name is required"),
  nicknameValidation: z.string().optional(),
  subName: z.string().optional(),
  code: z.string().min(1, "Product Code is required"),
  access: z.string().optional(),
  tag: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  logo: z
    .instanceof(File)
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "Only JPG, JPEG, PNG, or WEBP files are allowed")
    .refine((file) => file.size <= MAX_IMAGE_SIZE_BYTES, "File must be 10MB or smaller")
    .optional(),
  description: z.string().max(DESCRIPTION_MAX).optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
