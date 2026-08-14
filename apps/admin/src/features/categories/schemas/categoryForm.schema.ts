import { z } from "zod";

const RESERVED_KEYS = ["whatsapp", "email"];

// Image uploads (§4.5 Media/SEO), mirrors transactions' editTransaction.schema.
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, per system_architecture.md §4.9

const imageFileSchema = z
  .instanceof(File)
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "Only JPG, JPEG, or PNG files are allowed")
  .refine((file) => file.size <= MAX_IMAGE_SIZE_BYTES, "File must be 10MB or smaller")
  .optional();

/** Meta Description live-counter cap (§4.5). */
export const META_DESCRIPTION_MAX = 280;

const orderFormFieldSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .refine((key) => !RESERVED_KEYS.includes(key.trim().toLowerCase()), {
      message: "Reserved key — buyer contact is taken from their account.",
    }),
  label: z.string().optional(),
  required: z.boolean(),
});

/** Add Category form — product_requirements.md §4.5, follows the reference precisely. */
export const categoryFormSchema = z.object({
  categoryType: z.string().min(1, "Category Type is required"),
  name: z.string().min(1, "Category Name is required"),
  subName: z.string().optional(),
  accountNicknameValidation: z.string().optional(),
  region: z.string().optional(),
  code: z.string().min(1, "Category Code is required"),
  slug: z.string().min(1, "Category Slug is required"),
  orderFormFields: z.array(orderFormFieldSchema),
  // Media & description
  logo: imageFileSchema,
  description: z.string().optional(),
  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(META_DESCRIPTION_MAX).optional(),
  ogImage: imageFileSchema,
  metaKeywords: z.string().optional(),
  metaRobots: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
