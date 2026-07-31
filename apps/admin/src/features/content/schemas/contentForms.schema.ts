import { z } from "zod";

// Numeric inputs register with `valueAsNumber`, so the schema takes a real
// number. `z.coerce.number()` would type its input as `unknown` and break
// react-hook-form's resolver generic.

/** A `{heading?, paragraphs[]}` block of an article or page body. */
export const contentSectionSchema = z.object({
  heading: z.string().optional(),
  // Edited as one textarea and split on blank lines, so the form field is a
  // string and the service receives the array the API stores.
  body: z.string().min(1, "Section content is required"),
});

export const articleFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  articleCategoryId: z.string().min(1, "Category is required"),
  categoryLabel: z.string().optional(),
  type: z.enum(["article", "news"]),
  locale: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().max(300, "Excerpt must be 300 characters or fewer").optional(),
  authorName: z.string().min(1, "Author is required"),
  sections: z.array(contentSectionSchema).min(1, "At least one section is required"),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(280, "Meta description must be 280 characters or fewer").optional(),
  metaRobots: z.string().optional(),
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;

export const articleCategoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // The storefront filters on this and its pills are a closed set, so it is
  // constrained to a slug rather than free text.
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  sortOrder: z.number().int().min(0),
  status: z.boolean(),
});

export type ArticleCategoryFormValues = z.infer<typeof articleCategoryFormSchema>;

export const faqFormSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  group: z.string().optional(),
  locale: z.string().min(1),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;

export const pageFormSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  locale: z.string().min(1),
  title: z.string().min(1, "Title is required"),
  intro: z.string().optional(),
  sections: z.array(contentSectionSchema),
  isPublished: z.boolean(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(280, "Meta description must be 280 characters or fewer").optional(),
  metaRobots: z.string().optional(),
});

export type PageFormValues = z.infer<typeof pageFormSchema>;

export const testimonialFormSchema = z.object({
  authorName: z.string().min(1, "Name is required"),
  authorTitle: z.string().optional(),
  content: z.string().min(1, "Testimonial is required"),
  rating: z.number().int().min(1).max(5).optional(),
  gameName: z.string().optional(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

export const bannerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  link: z.string().optional(),
  /** Empty means a global banner shown on every game. */
  categoryId: z.string().optional(),
});

export type BannerFormValues = z.infer<typeof bannerFormSchema>;

export const announcementFormSchema = z.object({
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().optional(),
  isActive: z.boolean(),
});

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;
