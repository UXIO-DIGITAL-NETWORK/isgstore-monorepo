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
  // Monetapay needs the beneficiary's phone to run the disbursement. Accept the
  // common Indonesian mobile formats (0…, 62…, +62…).
  account_phone: z
    .string()
    .min(1, "No. HP penerima wajib diisi")
    .regex(/^(\+62|62|0)8[0-9]{7,12}$/, "No. HP penerima tidak valid"),
  notes: z.string().optional(),
});

export type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;
