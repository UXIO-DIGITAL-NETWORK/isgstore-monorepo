import { z } from "zod";

// Empty query shows all transactions; non-empty filters by invoice number or WhatsApp.
export const searchSchema = z.object({
  query: z.string(),
});

export type SearchFormValues = z.infer<typeof searchSchema>;
