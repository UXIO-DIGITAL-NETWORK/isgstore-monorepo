<?php

namespace App\Enums;

/**
 * refund_requests.method — decided once, at creation, from `transactions.user_id`.
 *
 * It is not a preference the customer or an admin can switch: a member's money
 * goes back to their wallet, a guest's is transferred by hand. Changing it
 * later would mean the refund had already moved down one of the two paths.
 */
enum RefundMethod: string
{
    /** Registered buyer — credited to `users.balance` automatically. */
    case BALANCE = 'balance';

    /** Guest buyer — an admin transfers to the account the customer supplies. */
    case MANUAL_TRANSFER = 'manual_transfer';

    /**
     * Refunded by the retired automatic Monetapay refund, before this table
     * existed. Backfilled so the refund page is authoritative for all of
     * history; never written by new code.
     */
    case LEGACY_GATEWAY = 'legacy_gateway';
}
