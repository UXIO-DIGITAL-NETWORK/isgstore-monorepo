import { z } from "zod";

const RESERVED_KEYS = ["whatsapp", "email"];

// Image uploads (§4.5 Media/SEO), mirrors transactions' editTransaction.schema.
// WEBP is accepted because ImageDropzone re-encodes every pick to it before the
// form ever sees the File — leaving it out would reject the browser's own
// optimised output.
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, per system_architecture.md §4.9

const imageFileSchema = z
  .instanceof(File)
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "Only JPG, JPEG, PNG, or WEBP files are allowed")
  .refine((file) => file.size <= MAX_IMAGE_SIZE_BYTES, "File must be 10MB or smaller")
  .optional();

/** Meta Description live-counter cap (§4.5). */
export const META_DESCRIPTION_MAX = 280;

const orderFormFieldSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .refine((key) => !RESERVED_KEYS.includes(key.trim().toLowerCase()), {
      // Left untranslated on purpose: a zod schema is built at module scope, far
      // from any React tree, so there is no `t` to call. Field-level validation
      // copy is its own piece of work.
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
  // Master on/off for the "Cek Username" check; the provider above is the "how".
  // No `.default()` — `defaultValues`/`values` always supply it, and a default
  // would split the schema's input/output types and break the form's Control type.
  accountNicknameCheckEnabled: z.boolean(),
  region: z.string().optional(),
  code: z.string().min(1, "Category Code is required"),
  slug: z.string().min(1, "Category Slug is required"),
  orderFormFields: z.array(orderFormFieldSchema),
  // Media & description
  logo: imageFileSchema,
  // Card background (portrait) and checkout header (wide). Separate from the
  // square logo overlay — the storefront reads these as the card's background
  // and the checkout page's banner.
  thumbnail: imageFileSchema,
  banner: imageFileSchema,
  description: z.string().optional(),
  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(META_DESCRIPTION_MAX).optional(),
  ogImage: imageFileSchema,
  metaKeywords: z.string().optional(),
  metaRobots: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
