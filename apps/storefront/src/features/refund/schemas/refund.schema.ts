import { z } from "zod";

import { E164_PATTERN, normalizeWhatsappNumber } from "@/lib/phone";

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

/**
 * Creating an account in order to be repaid as balance.
 *
 * The rules match the ordinary signup form — an account made here is a normal
 * member account, and must not be weaker for having been made in a hurry. What
 * this form cannot check is whether the email or phone is *allowed* to take
 * this particular refund: that depends on the order behind the token, so the
 * API decides it and returns a 422 the page surfaces verbatim.
 */
export const claimRegisterSchema = z
  .object({
    name: z.string().min(3, "register.errors.name"),
    email: z.email("register.errors.email"),
    // Checked against the canonical form the request carries, not the visible
    // text — see the note in `auth.schema.ts`.
    phone: z.string().refine((value) => E164_PATTERN.test(normalizeWhatsappNumber(value)), "register.errors.phone"),
    password: z.string().min(6, "register.errors.password"),
    password_confirmation: z.string(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: "register.errors.passwordConfirmation",
    path: ["password_confirmation"],
  });

export type ClaimRegisterFormValues = z.infer<typeof claimRegisterSchema>;
