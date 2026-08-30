import { z } from "zod";

import { WITHDRAWAL_MIN_AMOUNT } from "@/lib/withdrawalFee";

export const withdrawalSchema = z
  .object({
    amount: z
      .number({ message: "Nominal wajib diisi" })
      .int()
      .min(WITHDRAWAL_MIN_AMOUNT, `Minimal penarikan Rp ${WITHDRAWAL_MIN_AMOUNT.toLocaleString("id-ID")}`),
    // Only "one was chosen" is enforced here. The catalogue lives on the server
    // (`config/banks.php`, served by `GET /v1/payout-banks`) and it validates the
    // code on submit, so a bank being added no longer needs a frontend release.
    bank_code: z.string().trim().min(1, "Bank wajib dipilih"),
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
    /**
     * Which payout rail the picked code takes, set by the form from the fetched
     * catalogue rather than typed. It is form state, not a request field — the
     * page strips it before submitting. No `.default()`: that makes the schema's
     * input and output types disagree, which RHF's resolver refuses.
     */
    is_ewallet: z.boolean(),
  })
  // Bank transfers need an account number; e-wallet payouts are keyed on the phone.
  .superRefine((v, ctx) => {
    if (!v.is_ewallet && !v.account_number?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["account_number"],
        message: "Nomor rekening wajib diisi",
      });
    }
  });

export type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;
