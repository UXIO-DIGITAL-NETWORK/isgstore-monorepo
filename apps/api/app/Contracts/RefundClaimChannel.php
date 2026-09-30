<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Actions\Refund\SendRefundClaimNotificationAction;
use App\Models\RefundRequest;

/**
 * One way of telling a guest their money is waiting and where to claim it.
 *
 * Same seam as `ReceiptChannel`: the flow decides THAT it is time to notify, and
 * each channel plugged into `config/notifications.php` does its own delivery. A
 * client adding SMS or Telegram writes one class; the flow is not touched.
 *
 * There is deliberately NO idempotency guard here. The once-only stamp
 * (`claim_notified_at`) belongs to the flow, not to a channel: one refund, one
 * notification, however many channels carried it.
 *
 * @see SendRefundClaimNotificationAction the caller
 */
interface RefundClaimChannel
{
    /**
     * @param  string  $claimUrl  the public claim page, already built and already known to be reachable
     * @return bool true when a message was queued for a reachable recipient
     */
    public function send(RefundRequest $refund, string $claimUrl, string $locale): bool;
}
