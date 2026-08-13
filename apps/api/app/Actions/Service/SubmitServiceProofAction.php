<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\Enums\ServiceInvoiceStatus;
use App\Models\ServiceInvoice;
use RuntimeException;

/**
 * The client attaches its bukti transfer. Allowed from UNPAID and from
 * REJECTED — a refused proof must be re-uploadable, otherwise a typo in the
 * transfer strands the client with a dead invoice.
 *
 * The controller stores the file (as FinanceWithdrawalController::approve does)
 * and hands the path here.
 */
class SubmitServiceProofAction
{
    public function execute(ServiceInvoice $invoice, string $proofPath, ?string $notes = null): ServiceInvoice
    {
        $allowed = [ServiceInvoiceStatus::UNPAID, ServiceInvoiceStatus::REJECTED];

        if (! in_array($invoice->status, $allowed, true)) {
            throw new RuntimeException('Bukti transfer tidak dapat diunggah untuk invoice ini.');
        }

        $invoice->update([
            'proof_path' => $proofPath,
            'proof_uploaded_at' => now(),
            'status' => ServiceInvoiceStatus::WAITING_CONFIRMATION,
            'notes' => $notes ?? $invoice->notes,
        ]);

        return $invoice->fresh();
    }
}
