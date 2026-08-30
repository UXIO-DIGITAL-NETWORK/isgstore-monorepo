import { z } from "zod";

/**
 * Where the money goes. Mirrors the API's SubmitPayoutDetailsRequest, which in
 * turn mirrors the withdrawal payout rules — an e-wallet is keyed on the phone
 * number, a bank on the account number, so exactly one of them is required
 * depending on the code picked.
 *
 * The bank code itself is validated server-side against `BankCatalog`; the
 * form only enforces that one was chosen, so a catalogue change does not need
 * a frontend release.
 */
export const payoutDetailsSchema = z
  .object({
    bank_code: z.string().trim().min(1, "Select a bank or e-wallet"),
    account_number: z.string().trim().optional(),
    account_name: z.string().trim().min(1, "Account holder name is required"),
    account_phone: z.string().trim().optional(),
    /**
     * Set by the form from the picked code, not typed by the user. No
     * `.default()`: that would make the schema's input and output types
     * disagree, which RHF's resolver refuses to accept.
     */
    is_ewallet: z.boolean(),
  })
  .refine((values) => (values.is_ewallet ? Boolean(values.account_phone) : Boolean(values.account_number)), {
    message: "Enter the account number (or the e-wallet phone number)",
    path: ["account_number"],
  });

export type PayoutDetailsFormValues = z.infer<typeof payoutDetailsSchema>;

/**
 * The transfer confirmation. The note is optional but the proof is not
 * required either — a transfer made from a bank app that gives no downloadable
 * receipt still has to be recordable, and blocking it would push admins to
 * upload a screenshot of nothing.
 */
export const completeRefundSchema = z.object({
  note: z.string().trim().max(255, "Keep the note under 255 characters").optional(),
});

export type CompleteRefundFormValues = z.infer<typeof completeRefundSchema>;

/**
 * Refusing to return someone's money is the one action that always needs an
 * explanation on the record, so unlike the transaction refund's optional
 * reason this is mandatory — and the API enforces the same.
 */
export const rejectRefundSchema = z.object({
  reason: z.string().trim().min(1, "A rejection reason is required").max(255),
});

export type RejectRefundFormValues = z.infer<typeof rejectRefundSchema>;
