import { z } from "zod";

import { WITHDRAWAL_MIN_AMOUNT } from "@/lib/withdrawalFee";

/** Same field set as the merchant withdrawal form — no merchant to pick, the account is free-text either way. */
export const internalWithdrawalSchema = z
  .object({
    amount: z
      .number({ message: "Nominal wajib diisi" })
      .int()
      .min(WITHDRAWAL_MIN_AMOUNT, `Minimal penarikan Rp ${WITHDRAWAL_MIN_AMOUNT.toLocaleString("id-ID")}`),
    // Validated for "something was picked" only; the catalogue and the code
    // itself are the server's, served by `GET /v1/payout-banks`.
    bank_code: z.string().trim().min(1, "Bank wajib dipilih"),
    account_number: z.string().optional(),
    account_name: z.string().min(1, "Nama pemilik rekening wajib diisi"),
    account_phone: z
      .string()
      .min(1, "No. HP penerima wajib diisi")
      .regex(/^(\+62|62|0)8[0-9]{7,12}$/, "No. HP penerima tidak valid"),
    notes: z.string().optional(),
    /** The picked code's payout rail — form state set from the fetched catalogue, stripped before submit. */
    is_ewallet: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.is_ewallet && !v.account_number?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["account_number"],
        message: "Nomor rekening wajib diisi",
      });
    }
  });

export type InternalWithdrawalFormValues = z.infer<typeof internalWithdrawalSchema>;
