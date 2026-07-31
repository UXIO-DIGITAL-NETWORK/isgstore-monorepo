import { z } from "zod";

// The API needs at least a partial invoice number or a full phone number; it
// rejects anything shorter, so the form stops it here rather than round-tripping.
export const searchSchema = z.object({
  query: z.string().min(6, "Masukkan nomor invoice atau nomor WhatsApp yang valid"),
});

export type SearchFormValues = z.infer<typeof searchSchema>;
