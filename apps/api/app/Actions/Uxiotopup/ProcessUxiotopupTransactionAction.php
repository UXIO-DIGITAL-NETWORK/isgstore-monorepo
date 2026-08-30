<?php

namespace App\Actions\Uxiotopup;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\ProviderStatus;
use App\Enums\TransactionStatus;
use App\Exceptions\UxiotopupDuplicateOrderException;
use App\Jobs\PollUxiotopupStatusJob;
use App\Models\Transaction;
use App\Services\CustomerNumberFormatter;
use App\Services\UxiotopupService;
use App\Support\Uxiotopup\StatusPollSchedule;
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
                // uxiotopup holds the order but we never got its id back, and
                // /status has no lookup by our own reference — so this one is
                // genuinely unpollable, only the callback can finish it. The
                // PROCESSING default (SENDING) would claim we are still trying.
                'provider_status' => ProviderStatus::UNCONFIRMED,
            ]);

            $this->logAction->execute(new CreateActivityLogDTO(
                userId: null,
                ipAddress: '127.0.0.1',
                userAgent: 'System/UxiotopupWorker',
                message: "Uxiotopup duplicate idtrx for {$transaction->invoice_number} — order already placed, awaiting callback.",
                isSystem: true,
            ));

            return $transaction;
        }

        $supplierTrxId = $response['id'] ?? null;
        $mapped = $this->mapUxiotopupStatus($response['status'] ?? 'pending');

        $transaction->update([
            // data.id is uxiotopup's own invoice — the only key /status accepts.
            'supplier_trx_id' => $supplierTrxId,
            'sn' => ($response['keterangan'] ?? '') !== '' ? $response['keterangan'] : null,
            'supplier_status' => $response['status'] ?? 'pending',
            'status' => $mapped,
            // Still in flight: distinguish "the supplier took it and we can poll"
            // from "we are mid-call". A terminal response falls through to the
            // policy default (DELIVERED / REJECTED).
            ...($mapped === TransactionStatus::PROCESSING
                ? ['provider_status' => $supplierTrxId ? ProviderStatus::ORDERED : ProviderStatus::UNCONFIRMED]
                : []),
        ]);

        $this->logAction->execute(new CreateActivityLogDTO(
            userId: null,
            ipAddress: '127.0.0.1',
            userAgent: 'System/UxiotopupWorker',
            message: "Uxiotopup order sent for {$transaction->invoice_number}. Status: {$transaction->supplier_status}",
            isSystem: true,
        ));

        // The supplier callback is unreliable, so start the self-rescheduling poll
        // chain (5s → widening) that drives this order to its terminal state. Only
        // when it's actually in flight — an order that came back terminal, or the
        // duplicate-idtrx branch (no supplier_trx_id), has nothing to poll.
        if ($transaction->status === TransactionStatus::PROCESSING && $transaction->supplier_trx_id) {
            $transaction->forceFill(['supplier_status_checked_at' => now()])->saveQuietly();

            PollUxiotopupStatusJob::dispatch($transaction->id, now()->toIso8601String())
                ->delay(now()->addSeconds(StatusPollSchedule::intervalSeconds(0)));
        }

        return $transaction;
    }
}
