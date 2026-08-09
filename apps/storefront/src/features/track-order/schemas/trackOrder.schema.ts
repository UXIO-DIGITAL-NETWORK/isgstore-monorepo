import { z } from "zod";

// The API needs at least a partial invoice number, a full phone number, or an
// email; it rejects anything shorter, so the form stops it here rather than
// round-tripping.
export const searchSchema = z.object({
  query: z.string().min(6, "Masukkan nomor invoice, WhatsApp, atau email yang valid"),
});

export type SearchFormValues = z.infer<typeof searchSchema>;
