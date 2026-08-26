<?php

declare(strict_types=1);

namespace App\Support\Ledger;

use App\Models\PlatformMutation;

/**
 * Books a paid service invoice's revenue as kita's income on the platform
 * ledger — symmetrical to WithdrawalFeeLedger, but for service billing
 * instead of a withdrawal's fee.
 *
 * `App\Actions\Service\ActivateServiceSubscriptionAction` deliberately touches
 * no ledger; the credit happens here, called from its two callers instead —
 * the Monetapay webhook (`HandleMonetapayCallbackAction::handleServiceInvoicePayment`)
 * and the manual confirm path (`ConfirmServiceInvoiceAction`) — each with its
 * own reference, so a payment collected through the gateway and one confirmed
 * by hand can never collide.
 *
 * Idempotent: keyed on one `service_revenue` platform mutation per reference,
 * so a retried webhook or a repeated call credits exactly once. A zero/negative
 * amount is a no-op (PlatformLedger rejects zero-amount mutations).
 */
final class ServiceRevenueLedger
{
    public static function credit(int $amount, string $reference, string $description): void
    {
        if ($amount <= 0) {
            return;
        }

        $already = PlatformMutation::query()
            ->where('type', 'service_revenue')
            ->where('reference', $reference)
            ->exists();

        if ($already) {
            return;
        }

        PlatformLedger::record(
            amount: $amount,
            type: 'service_revenue',
            reference: $reference,
            description: $description,
        );
    }
}
