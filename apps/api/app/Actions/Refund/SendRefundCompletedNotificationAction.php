<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Contracts\RefundCompletedChannel;
use App\Models\RefundRequest;
use App\Support\Integration\AdapterResolver;

/**
 * Closes the loop: tells the customer the transfer has actually been made.
 *
 * The channels are a list (`config('notifications.refund_completed')`) — adding
 * SMS or a social-media webhook means one class plus one config line, not a
 * change here. Rows with no reachable contact are not an error: the channel
 * simply reports nothing was queued.
 *
 * Without this notification a guest's last signal is "we owe you money", and
 * support carries every "did you send it?" question by hand.
 */
class SendRefundCompletedNotificationAction
{
    public function execute(RefundRequest $refund): void
    {
        $refund->loadMissing('transaction');
        $locale = $this->resolveLocale($refund);

        foreach (AdapterResolver::resolveAll(RefundCompletedChannel::class, (array) config('notifications.refund_completed', [])) as $channel) {
            $channel->send($refund, $locale);
        }
    }

    private function resolveLocale(RefundRequest $refund): string
    {
        $locale = $refund->transaction?->locale;

        return in_array($locale, ['id', 'en'], true) ? $locale : 'id';
    }
}
