<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Actions\Refund\SendRefundCompletedNotificationAction;
use App\Models\RefundRequest;

/**
 * One way of closing the loop: telling the customer the transfer has actually
 * been made.
 *
 * Same seam as `RefundClaimChannel`. Without this notification a guest's last
 * signal is "we owe you money", and support carries every "did you send it?"
 * question by hand.
 *
 * @see SendRefundCompletedNotificationAction the caller
 */
interface RefundCompletedChannel
{
    /**
     * @return bool true when a message was queued for a reachable recipient
     */
    public function send(RefundRequest $refund, string $locale): bool;
}
