<?php

namespace App\Actions\Uxiotopup;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\TransactionStatus;
use App\Exceptions\UxiotopupDuplicateOrderException;
use App\Models\Transaction;
use App\Services\CustomerNumberFormatter;
use App\Services\UxiotopupService;
use App\Traits\MapsUxiotopupStatus;
use Exception;

class ProcessUxiotopupTransactionAction
{
    use MapsUxiotopupStatus;

    public function __construct(
        private readonly UxiotopupService $uxiotopupService,
        private readonly CreateActivityLogAction $logAction,
        private readonly CustomerNumberFormatter $customerNumberFormatter
    ) {}

    public function execute(Transaction $transaction): Transaction
    {
        // Resolve the active supplier mapping for this product
        $supplierProduct = $transaction->product
            ->supplierProducts()
            ->where('is_active', true)
            ->first();

        if (! $supplierProduct) {
            throw new Exception('Produk ini belum dipetakan ke supplier aktif.');
        }

        // target shape is data-driven per category (categories.order_form_fields);
        // uxiotopup expects "dataId|zoneId" (pipe), or just dataId when no zone.
        $target = $this->customerNumberFormatter->forTransaction($transaction);

        // kontak is mandatory on /order. Members may not have a phone and guest
        // checkouts may omit contact, so fall back to a placeholder rather than
        // failing a paid order over an optional-for-us field.
        $transaction->loadMissing('user');
        $kontak = $transaction->user?->phone ?: $transaction->guest_contact ?: '0000000000';

        try {
            $response = $this->uxiotopupService->createOrder(
                $supplierProduct->buyer_sku_code, // holds the uxiotopup service_id
                $target,
                $kontak,
                $transaction->invoice_number // used as uxiotopup idtrx
            );
        } catch (UxiotopupDuplicateOrderException $e) {
            // A previous attempt (whose response we lost) already placed this
            // order. Settle to PROCESSING and let the callback finalise it —
            // rethrowing would re-order forever and failed() would refund a
            // customer whose topup is actually in flight.
            $transaction->update([
                'supplier_status' => $transaction->supplier_status ?? 'pending',
                'status' => TransactionStatus::PROCESSING,
            ]);

            $this->logAction->execute(new CreateActivityLogDTO(
                userId: null,
                ipAddress: '127.0.0.1',
                userAgent: 'System/UxiotopupWorker',
                message: "Uxiotopup duplicate idtrx for {$transaction->invoice_number} — order already placed, awaiting callback."
            ));

            return $transaction;
        }

        $transaction->update([
            // data.id is uxiotopup's own invoice — the only key /status accepts.
            'supplier_trx_id' => $response['id'] ?? null,
            'sn' => ($response['keterangan'] ?? '') !== '' ? $response['keterangan'] : null,
            'supplier_status' => $response['status'] ?? 'pending',
            'status' => $this->mapUxiotopupStatus($response['status'] ?? 'pending'),
        ]);

        $this->logAction->execute(new CreateActivityLogDTO(
            userId: null,
            ipAddress: '127.0.0.1',
            userAgent: 'System/UxiotopupWorker',
            message: "Uxiotopup order sent for {$transaction->invoice_number}. Status: {$transaction->supplier_status}"
        ));

        return $transaction;
    }
}
