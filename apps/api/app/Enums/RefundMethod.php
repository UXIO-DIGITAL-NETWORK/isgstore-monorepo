<?php

namespace App\Enums;

/**
 * refund_requests.method — decided once, at creation, from `transactions.user_id`.
 *
 * It is not a preference the customer or an admin can switch: the method says
 * which of three quite different paths the money took, and changing it later
 * would mean the refund had already walked one of them.
 */
enum RefundMethod: string
{
    /**
     * The buyer was signed in when they ordered. Credited to `users.balance`
     * in the same transaction that opened the refund, so the row is born
     * COMPLETED and there is nothing for an admin to do.
     */
    case BALANCE = 'balance';

    /**
     * The buyer checked out as a guest. The money goes to `users.balance` too,
     * but only after they create (or sign in to) an account whose contact
     * matches the order, and only after an admin has verified that account.
     * Born WAITING_ACCOUNT; see `ClaimRefundWithAccountAction`.
     */
    case BALANCE_CLAIM = 'balance_claim';

    /**
     * The retired guest path: an admin transferred to a bank account the
     * customer supplied. **No new rows are opened this way.** The ones already
     * open are worked to completion through the same admin queue, so every
     * payout guard still has to handle this case — it is legacy, not dead.
     */
    case MANUAL_TRANSFER = 'manual_transfer';

    /**
     * Refunded by the retired automatic Monetapay refund, before this table
     * existed. Backfilled so the refund page is authoritative for all of
     * history; never written by new code.
     */
    case LEGACY_GATEWAY = 'legacy_gateway';
}
