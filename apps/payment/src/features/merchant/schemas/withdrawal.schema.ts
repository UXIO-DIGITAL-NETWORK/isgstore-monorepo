import { z } from "zod";

import { BANK_CODES, isEwalletCode } from "../constants/bankCodes";
import { WITHDRAWAL_MIN_AMOUNT } from "../lib/withdrawalFee";

export const withdrawalSchema = z
  .object({
    amount: z
      .number({ message: "Nominal wajib diisi" })
      .int()
      .min(WITHDRAWAL_MIN_AMOUNT, `Minimal penarikan Rp ${WITHDRAWAL_MIN_AMOUNT.toLocaleString("id-ID")}`),
    // Constrained to the known catalogue — the form uses a searchable picker, so a
    // free value can only arrive by tampering.
    bank_code: z.enum(BANK_CODES, { message: "Bank wajib dipilih" }),
    // Optional at the type level; required for banks via the refine below.
    account_number: z.string().optional(),
    account_name: z.string().min(1, "Nama pemilik rekening wajib diisi"),
    // Monetapay needs the beneficiary's phone (the wallet id for e-wallets).
    // Accept the common Indonesian mobile formats (0…, 62…, +62…).
    account_phone: z
      .string()
      .min(1, "No. HP penerima wajib diisi")
      .regex(/^(\+62|62|0)8[0-9]{7,12}$/, "No. HP penerima tidak valid"),
    notes: z.string().optional(),
  })
  // Bank transfers need an account number; e-wallet payouts are keyed on the phone.
  .superRefine((v, ctx) => {
    if (!isEwalletCode(v.bank_code) && !v.account_number?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["account_number"],
        message: "Nomor rekening wajib diisi",
      });
    }
  });

export type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;
