<?php

namespace App\Actions\Uxiotopup;

use App\Actions\Refund\InitiateRefundAction;
use App\Actions\Transaction\SendTransactionReceiptAction;
use App\Enums\ProviderStatus;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Services\UxiotopupService;
use App\Traits\MapsUxiotopupStatus;
use Exception;

class CheckUxiotopupTransactionStatusAction
{
    use MapsUxiotopupStatus;

    public function __construct(
        private readonly UxiotopupService $uxiotopupService,
        private readonly InitiateRefundAction $refundAction,
        private readonly SendTransactionReceiptAction $receiptAction,
    ) {}

    public function execute(string $invoiceNumber): Transaction
    {
        $transaction = Transaction::where('invoice_number', $invoiceNumber)
            ->where('status', TransactionStatus::PROCESSING->value)
            ->firstOrFail();

        // /status only accepts uxiotopup's own invoice id. Without one (the
        // order response was lost mid-flight) there is nothing to poll — the
        // callback, which carries our idtrx, is the only path that can resolve
        // this transaction.
        if (! $transaction->supplier_trx_id) {
            throw new Exception('Transaksi belum memiliki ID order uxiotopup — menunggu callback dari supplier.');
        }

        $response = $this->uxiotopupService->checkTransactionStatus($transaction->supplier_trx_id);

        $newStatus = $this->mapUxiotopupStatus($response['status'] ?? 'pending');
        $sn = (string) ($response['keterangan'] ?? '');

        $transaction->update([
            'sn' => $sn !== '' ? $sn : $transaction->sn,
            'supplier_status' => $response['status'] ?? $transaction->supplier_status,
            'status' => $newStatus,
            // Reaching here means we polled /status BY supplier_trx_id, so the
            // supplier demonstrably has the order — ORDERED, never SENDING.
            ...($newStatus === TransactionStatus::PROCESSING
                ? ['provider_status' => ProviderStatus::ORDERED]
                : []),
        ]);

        $fresh = $transaction->fresh();

        // Mirror the webhook's terminal side effects: once this poll marks the
        // row terminal, the callback's idempotency guard will skip it — so the
        // refund/receipt must happen here or never. Both actions are idempotent.
        if ($newStatus === TransactionStatus::FAILED_PROVIDER) {
            $this->refundAction->execute($fresh);
        }

        if ($newStatus === TransactionStatus::COMPLETED) {
            $this->receiptAction->execute($fresh);
        }

        return $fresh;
    }
}
