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
 * no ledger; the credit happens here, called from its callers instead — the
 * Monetapay webhook (`HandleMonetapayCallbackAction::handleServiceInvoicePayment`),
 * the manual confirm path (`ConfirmServiceInvoiceAction`), and the recovery sweep
 * (`SyncExpiredServicePaymentsCommand`). The webhook and the sweep share the
 * ATTEMPT's reference so the two cannot both book one payment; the manual path
 * keys on the invoice number, because a hand-confirmed bill has no attempt.
 *
 * Every path that can mark a bill paid must call this. The sweep landed without
 * it and lost revenue silently for exactly that reason — adding a caller is not
 * optional bookkeeping, it is the other half of the write.
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
