import { z } from "zod";

import { BANK_CODES, isEwalletCode } from "@/constants/bankCodes";
import { WITHDRAWAL_MIN_AMOUNT } from "@/lib/withdrawalFee";

/** Same field set as the merchant withdrawal form — no merchant to pick, the account is free-text either way. */
export const internalWithdrawalSchema = z
  .object({
    amount: z
      .number({ message: "Nominal wajib diisi" })
      .int()
      .min(WITHDRAWAL_MIN_AMOUNT, `Minimal penarikan Rp ${WITHDRAWAL_MIN_AMOUNT.toLocaleString("id-ID")}`),
    bank_code: z.enum(BANK_CODES, { message: "Bank wajib dipilih" }),
    account_number: z.string().optional(),
    account_name: z.string().min(1, "Nama pemilik rekening wajib diisi"),
    account_phone: z
      .string()
      .min(1, "No. HP penerima wajib diisi")
      .regex(/^(\+62|62|0)8[0-9]{7,12}$/, "No. HP penerima tidak valid"),
    notes: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (!isEwalletCode(v.bank_code) && !v.account_number?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["account_number"],
        message: "Nomor rekening wajib diisi",
      });
    }
  });

export type InternalWithdrawalFormValues = z.infer<typeof internalWithdrawalSchema>;
