import { z } from "zod";

/** Add / Edit Category Server form — product_requirements.md §4.5.
 *
 * The reference labels the name field "Category Type Name"; that is a
 * copy-paste leftover from the Category Type form built immediately before
 * it, so the message here names the right entity. */
export const categoryServerFormSchema = z.object({
  name: z.string().min(1, "Category Server Name is required"),
  options: z.array(
    z.object({
      name: z.string().min(1, "Option name is required"),
      value: z.string().min(1, "Option value is required"),
    }),
  ),
});

export type CategoryServerFormValues = z.infer<typeof categoryServerFormSchema>;
