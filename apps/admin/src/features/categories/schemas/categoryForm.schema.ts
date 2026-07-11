import { z } from "zod";

const RESERVED_KEYS = ["whatsapp", "email"];

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
  uidParser: z.string().min(1, "Category UID Parser is required"),
  name: z.string().min(1, "Category Name is required"),
  subName: z.string().optional(),
  accountNicknameValidation: z.string().optional(),
  region: z.string().optional(),
  code: z.string().min(1, "Category Code is required"),
  slug: z.string().min(1, "Category Slug is required"),
  orderFormFields: z.array(orderFormFieldSchema),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
