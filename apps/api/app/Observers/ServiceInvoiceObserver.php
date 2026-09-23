<?php

namespace App\Observers;

use App\Enums\ServiceInvoiceStatus;
use App\Events\ServiceInvoiceUpdated;
use App\Jobs\SendDiscordActivityJob;
use App\Models\ServiceInvoice;

/**
 * Single choke point for realtime service-invoice broadcasts. Status changes
 * across confirm/reject/expire/webhook all flow through one event here.
 */
class ServiceInvoiceObserver
{
    public function created(ServiceInvoice $invoice): void
    {
        ServiceInvoiceUpdated::dispatch($invoice);

        SendDiscordActivityJob::serviceInvoiceCreated($invoice);
    }

    public function updated(ServiceInvoice $invoice): void
    {
        if (! $invoice->wasChanged('status')) {
            return;
        }

        ServiceInvoiceUpdated::dispatch($invoice);

        // Only the two the payment path does not announce. PAID is reported by
        // the Monetapay callback that settled it; EXPIRED is the due-date
        // sweep, which is not something an operator has to act on.
        if (in_array($invoice->status, [ServiceInvoiceStatus::REJECTED, ServiceInvoiceStatus::CANCELLED], true)) {
            SendDiscordActivityJob::serviceInvoiceClosed($invoice);
        }
    }
}
