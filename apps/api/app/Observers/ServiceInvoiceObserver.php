<?php

namespace App\Observers;

use App\Events\ServiceInvoiceUpdated;
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
    }

    public function updated(ServiceInvoice $invoice): void
    {
        if ($invoice->wasChanged('status')) {
            ServiceInvoiceUpdated::dispatch($invoice);
        }
    }
}
