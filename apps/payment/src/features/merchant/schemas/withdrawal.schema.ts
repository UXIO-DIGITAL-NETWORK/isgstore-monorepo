import { z } from "zod";

export const withdrawalSchema = z.object({
  amount: z.number().int().positive("Nominal harus lebih dari 0"),
  bank_code: z.string().min(1, "Bank wajib diisi"),
  account_number: z.string().min(1, "Nomor rekening wajib diisi"),
  account_name: z.string().min(1, "Nama pemilik rekening wajib diisi"),
  notes: z.string().optional(),
});

export type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;
