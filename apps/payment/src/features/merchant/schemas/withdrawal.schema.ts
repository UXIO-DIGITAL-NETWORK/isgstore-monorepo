import { z } from "zod";

import { BANK_CODES } from "../constants/bankCodes";
import { WITHDRAWAL_MIN_AMOUNT } from "../lib/withdrawalFee";

export const withdrawalSchema = z.object({
  amount: z
    .number({ message: "Nominal wajib diisi" })
    .int()
    .min(WITHDRAWAL_MIN_AMOUNT, `Minimal penarikan Rp ${WITHDRAWAL_MIN_AMOUNT.toLocaleString("id-ID")}`),
  // Constrained to the known bank list — the form uses a dropdown, so a free
  // value can only arrive by tampering.
  bank_code: z.enum(BANK_CODES, { message: "Bank wajib dipilih" }),
  account_number: z.string().min(1, "Nomor rekening wajib diisi"),
  account_name: z.string().min(1, "Nama pemilik rekening wajib diisi"),
  notes: z.string().optional(),
});

export type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;
