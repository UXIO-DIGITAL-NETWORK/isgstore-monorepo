<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\DTOs\Service\ConfirmServiceInvoiceDTO;
use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Models\ServiceInstallation;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Kita confirms the bukti transfer. This is the only place a subscription is
 * born: the invoice flips to PAID and a period is opened for its duration.
 *
 * Renewals stack. If the client already holds an active period for the same
 * service, the new one starts where that one ends rather than overwriting it,
 * so a client who renews early keeps every day they paid for and the purchase
 * history stays one row per purchase.
 *
 * Deliberately touches no ledger: the money arrived by bank transfer into an
 * account PlatformLedger does not model, so crediting it there would stop
 * `platform_accounts.balance` meaning "admin fees net of gateway fees".
 */
class ConfirmServiceInvoiceAction
{
    public function execute(ConfirmServiceInvoiceDTO $dto): ServiceInvoice
    {
        return DB::transaction(function () use ($dto) {
            /** @var ServiceInvoice $invoice */
            $invoice = ServiceInvoice::whereKey($dto->invoiceId)->lockForUpdate()->firstOrFail();

            // Idempotency: a double-click or a retried request must not open a
            // second period against one payment.
            if ($invoice->status === ServiceInvoiceStatus::PAID) {
                throw new RuntimeException('Invoice ini sudah dikonfirmasi.');
            }

            $invoice->update([
                'status' => ServiceInvoiceStatus::PAID,
                'verified_by' => $dto->verifierId,
                'verified_at' => now(),
                'notes' => $dto->notes ?? $invoice->notes,
            ]);

            $currentEndsAt = ServiceSubscription::query()
                ->where('merchant_id', $invoice->merchant_id)
                ->where('service_id', $invoice->service_id)
                ->where('status', SubscriptionStatus::ACTIVE)
                ->max('ends_at');

            $startsAt = $currentEndsAt
                ? Carbon::parse($currentEndsAt)->max(now())
                : now();

            $subscription = ServiceSubscription::create([
                'merchant_id' => $invoice->merchant_id,
                'service_id' => $invoice->service_id,
                'service_invoice_id' => $invoice->id,
                'starts_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addDays((int) $invoice->duration_days),
                'status' => SubscriptionStatus::ACTIVE,
            ]);

            // Every newly paid service gets an installation record immediately,
            // so the client's invoice page never has to render a null. A renewal
            // finds the existing row and leaves its window, checklist and
            // credentials intact — installations are per service account, not
            // per paid period.
            $installation = ServiceInstallation::firstOrCreate(
                [
                    'merchant_id' => $invoice->merchant_id,
                    'service_id' => $invoice->service_id,
                ],
                ['service_subscription_id' => $subscription->id],
            );

            // Stamp ONLY a row that has never been stamped — i.e. one kita
            // prepared from the invoice page before confirming. A renewal finds
            // a row already pointing at the FIRST period and must leave it:
            // this column records which period paid for the install, is audit
            // only, and never scopes a read.
            if ($installation->service_subscription_id === null) {
                $installation->update(['service_subscription_id' => $subscription->id]);
            }

            return $invoice->fresh(['service', 'subscription']);
        });
    }
}
