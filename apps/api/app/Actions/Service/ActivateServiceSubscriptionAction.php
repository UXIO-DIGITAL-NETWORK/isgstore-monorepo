<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\Actions\Notification\NotifyPaymentInternalAction;
use App\Enums\SubscriptionStatus;
use App\Jobs\PushLicenceRenewalJob;
use App\Jobs\PushServiceOrderToHubJob;
use App\Models\ServiceInstallation;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use Illuminate\Support\Carbon;

/**
 * Opens the subscription period a paid invoice bought.
 *
 * The single definition of what "the client now has this service" means, so
 * the two ways an invoice gets paid — the Monetapay webhook, and a
 * payment-internal user marking it paid by hand — can never drift apart on the
 * stacking rule.
 *
 * Renewals stack. If the client already holds an active period for the same
 * service, the new one starts where that one ends rather than overwriting it,
 * so a client who renews early keeps every day they paid for and the purchase
 * history stays one row per purchase.
 *
 * Assumes the caller already holds a lock on the invoice and has flipped it to
 * PAID — this is the second half of that transaction, not a standalone step.
 *
 * Deliberately touches no ledger: a service bill is kita selling to a client,
 * which is not a movement `platform_accounts.balance` models.
 */
class ActivateServiceSubscriptionAction
{
    public function execute(ServiceInvoice $invoice): ServiceSubscription
    {
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

        // Every newly paid service gets an installation record immediately, so
        // the client's invoice page never has to render a null. A renewal finds
        // the existing row and leaves its window, checklist and credentials
        // intact — installations are per service account, not per paid period.
        $installation = ServiceInstallation::firstOrCreate(
            [
                'merchant_id' => $invoice->merchant_id,
                'service_id' => $invoice->service_id,
            ],
            ['service_subscription_id' => $subscription->id],
        );

        // Stamp ONLY a row that has never been stamped — i.e. one kita prepared
        // from the invoice page before payment. A renewal finds a row already
        // pointing at the FIRST period and must leave it: this column records
        // which period paid for the install, is audit only, and never scopes a
        // read.
        if ($installation->service_subscription_id === null) {
            $installation->update(['service_subscription_id' => $subscription->id]);
        }

        // Alert the internal team that a client paid a service bill. Both the
        // webhook and the manual confirm converge here, so this fires exactly
        // once per paid invoice regardless of which path settled it.
        $merchantName = $invoice->merchant?->name ?? "Client #{$invoice->merchant_id}";
        app(NotifyPaymentInternalAction::class)->execute(
            type: 'service_payment',
            title: 'Pembayaran layanan',
            message: "{$merchantName} membayar {$invoice->service_name} — {$invoice->invoice_number} Rp ".number_format((int) $invoice->amount),
            data: [
                'invoice_number' => $invoice->invoice_number,
                'merchant_id' => $invoice->merchant_id,
                'service_id' => $invoice->service_id,
                'amount' => (int) $invoice->amount,
            ],
        );

        // The single convergence point for "the client now has this service" —
        // webhook, manual confirm and the recovery sweep all land here — so the
        // Hub learns an order is PAID exactly once, however it settled.
        PushServiceOrderToHubJob::maybeDispatch($invoice);

        // And, when the service bought was this site's OWN subscription, tell
        // the Hub to extend the licence. A client who pays must not stay
        // switched off; see PushLicenceRenewalJob.
        PushLicenceRenewalJob::maybeDispatch($invoice);

        return $subscription;
    }
}
