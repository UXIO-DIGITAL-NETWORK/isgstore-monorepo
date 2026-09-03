import { z } from "zod";

// Same upload constraints as the Category form, plus WEBP — the frame's
// dropzone caption reads "JPG, JPEG, PNG, WEBP up to 10mb".
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, per system_architecture.md §4.9

/** Description live-counter cap, as the frame's "0/280 characters" shows. */
export const DESCRIPTION_MAX = 280;

// ponytail: money and percentages stay strings, like every other field on this
// form — `z.coerce.number()` turns an empty optional field into 0, which would
// read as "priced at zero" rather than "not filled in". Parse at the point the
// payload finally needs numbers.
const digits = (label: string) => z.string().regex(/^\d*$/, `${label} must be a number`).optional();

const percent = (label: string) =>
  z
    .string()
    .regex(/^\d*$/, `${label} must be a number`)
    .refine((value) => value === "" || Number(value) <= 100, `${label} cannot exceed 100`)
    .optional();

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

  /* Pricing & Margin. Optional like the rest — the frame marks nothing
     required, and a product can be filed before it is priced. */
  /** Point earn rate. Blank = fall back to the global points settings. */
  points: percent("Points"),
  /** Flat bonus points, the sweetener a cheap denomination needs to be worth
      anything at a percentage alone. */
  pointsFlat: digits("Bonus Points"),
  discount: percent("Discount"),
  costPrice: digits("Cost Price"),
  publicPrice: digits("Public Price"),
  vipPrice: digits("VIP Price"),
  resellerPrice: digits("Reseller Price"),
  agentPrice: digits("Agent Price"),

  /* Product Mix. Empty by default, so an untouched section never blocks Save;
     a row the admin did add must be complete to mean anything. */
  productMix: z.array(
    z.object({
      supplierProduct: z.string().min(1, "Supplier Product is required"),
      quantity: z.string().regex(/^[1-9]\d*$/, "Quantity must be at least 1"),
    }),
  ),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
