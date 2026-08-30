import { z } from "zod";

/**
 * Where the refund should be sent. Mirrors the API's SubmitPayoutDetailsRequest,
 * which in turn mirrors the withdrawal payout rules: an e-wallet is keyed on a
 * phone number, a bank on an account number, so exactly one is required
 * depending on the destination picked.
 *
 * The bank code itself is validated server-side against the payout catalogue —
 * the form only checks that one was chosen, so a catalogue change never needs a
 * frontend release.
 */
export const payoutDetailsSchema = z
  .object({
    bank_code: z.string().min(1, "form.errors.bank"),
    account_number: z.string().optional(),
    account_name: z.string().min(1, "form.errors.accountName"),
    account_phone: z.string().optional(),
    /** Set by the form from the picked code, never typed by the customer. */
    is_ewallet: z.boolean(),
  })
  .refine((values) => (values.is_ewallet ? Boolean(values.account_phone?.trim()) : Boolean(values.account_number?.trim())), {
    // Points at whichever field is actually shown for the chosen destination.
    message: "form.errors.accountNumber",
    path: ["account_number"],
  });

export type PayoutDetailsFormValues = z.infer<typeof payoutDetailsSchema>;

/**
 * The "I lost the email" lookup. Both identifiers are required and both must
 * match — one alone is not enough to be handed control of where money goes.
 */
export const claimLookupSchema = z.object({
  invoice_number: z.string().min(6, "lookup.invoice"),
  contact: z.string().min(6, "lookup.contact"),
});

export type ClaimLookupFormValues = z.infer<typeof claimLookupSchema>;
