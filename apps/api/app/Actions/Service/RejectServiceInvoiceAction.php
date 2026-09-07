<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\Enums\ServiceInvoiceStatus;
use App\Models\ServiceInvoice;
use App\Models\User;
use RuntimeException;

/**
 * Kita refuses the bukti transfer. The invoice stays open — REJECTED is a state
 * REJECTED, so the client can open a fresh payment against the same bill.
 */
class RejectServiceInvoiceAction
{
    public function execute(ServiceInvoice $invoice, User $verifier, ?string $reason = null): ServiceInvoice
    {
        if ($invoice->status === ServiceInvoiceStatus::PAID) {
            throw new RuntimeException('Invoice ini sudah dikonfirmasi dan tidak dapat ditolak.');
        }

        $invoice->update([
            'status' => ServiceInvoiceStatus::REJECTED,
            'verified_by' => $verifier->id,
            'verified_at' => now(),
            'notes' => $reason ?? $invoice->notes,
        ]);

        return $invoice->fresh();
    }
}
