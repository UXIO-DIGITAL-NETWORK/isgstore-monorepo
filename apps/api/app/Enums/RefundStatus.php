<?php

namespace App\Enums;

/**
 * refund_requests.status.
 *
 * The member path (`RefundMethod::BALANCE`) is born COMPLETED — the wallet
 * credit happens in the same DB transaction that writes the row. Only a guest
 * refund walks the queue:
 *
 *   WAITING_ACCOUNT → PENDING → PROCESSING → COMPLETED
 *     (balance_claim)     ↑                ↘ REJECTED
 *                         │
 *   WAITING_DETAILS ──────┘
 *     (manual_transfer, retired — open rows only)
 *
 * WAITING_ACCOUNT is blocked on the *customer*: the money is owed, but there
 * is no account to credit until they make one. WAITING_DETAILS is its retired
 * counterpart, blocked on the customer supplying a bank account.
 *
 * PROCESSING is not decoration: it means a named admin has claimed the row
 * (`processed_by`). For a manual transfer it is what stops two admins sending
 * the same money twice; for a balance claim it is what stops two admins
 * verifying the same account in parallel and reaching opposite conclusions.
 */
enum RefundStatus: string
{
    /** Recorded; waiting for the customer to create or sign in to an account. */
    case WAITING_ACCOUNT = 'WAITING_ACCOUNT';

    /** Recorded; waiting for the customer's payout details. Retired path only. */
    case WAITING_DETAILS = 'WAITING_DETAILS';

    /** Ready for an admin: an account to verify, or a transfer to make. */
    case PENDING = 'PENDING';

    /** An admin has claimed it and is verifying / transferring. */
    case PROCESSING = 'PROCESSING';

    /** Money has moved: wallet credited, or the bank transfer is done. */
    case COMPLETED = 'COMPLETED';

    /** Refused, with a reason. No money moves; settlement is left intact. */
    case REJECTED = 'REJECTED';

    /** States after which no further action is possible. */
    public static function terminal(): array
    {
        return [self::COMPLETED, self::REJECTED];
    }

    public function isTerminal(): bool
    {
        return in_array($this, self::terminal(), true);
    }

    /**
     * States where the payout destination may still be written.
     *
     * Status alone is not the whole answer — a `balance_claim` refund also sits
     * in PENDING and must never accept a bank account. Ask
     * `RefundRequest::isPayoutEditable()`, which pairs this with the method.
     */
    public static function payoutEditable(): array
    {
        return [self::WAITING_DETAILS, self::PENDING];
    }

    /**
     * States where the claim link is still live and may be re-sent or rotated.
     *
     * Deliberately separate from `payoutEditable()`: "can this customer still
     * act on their link" and "may a bank account still be written" are two
     * different questions that happen to have overlapped under the retired
     * scheme. Overloading one for both is what silently broke resend for
     * WAITING_ACCOUNT — and `resend`'s constant response hides the failure.
     */
    public static function claimable(): array
    {
        return [self::WAITING_ACCOUNT, self::WAITING_DETAILS];
    }
}
