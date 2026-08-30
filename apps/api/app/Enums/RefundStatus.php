<?php

namespace App\Enums;

/**
 * refund_requests.status.
 *
 * The member path is born COMPLETED (the wallet credit happens in the same DB
 * transaction that writes the row). Only the guest path walks the queue:
 *
 *   WAITING_DETAILS → PENDING → PROCESSING → COMPLETED
 *                             ↘ REJECTED
 *
 * PROCESSING is not decoration: it means a named admin has claimed the row
 * (`processed_by`), which is the only thing stopping two admins making the same
 * bank transfer twice.
 */
enum RefundStatus: string
{
    /** Recorded; waiting for the customer's payout details. */
    case WAITING_DETAILS = 'WAITING_DETAILS';

    /** Payout details in hand; waiting for an admin to transfer. */
    case PENDING = 'PENDING';

    /** An admin has claimed it and is transferring. */
    case PROCESSING = 'PROCESSING';

    /** Money has left: wallet credited, or the bank transfer is done. */
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

    /** States where the payout destination may still be written. */
    public static function payoutEditable(): array
    {
        return [self::WAITING_DETAILS, self::PENDING];
    }
}
