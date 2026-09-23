<?php

namespace App\Actions\Uxiolabs;

use App\Actions\Points\GrantTransactionPointsAction;
use App\Actions\Refund\InitiateRefundAction;
use App\Actions\Transaction\SendTransactionReceiptAction;
use App\Enums\ProviderStatus;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Services\UxiolabsService;
use App\Traits\MapsUxiolabsStatus;
use Exception;

class CheckUxiolabsTransactionStatusAction
{
    use MapsUxiolabsStatus;

    public function __construct(
        private readonly UxiolabsService $uxiolabsService,
        private readonly InitiateRefundAction $refundAction,
        private readonly SendTransactionReceiptAction $receiptAction,
        private readonly GrantTransactionPointsAction $pointsAction,
        private readonly SendUxiolabsStatusNotificationAction $announce,
    ) {}

    /**
     * `$source` only labels the announcement — the poll chain and an admin
     * pressing "cek status" reach the same supplier endpoint, but "we polled"
     * and "someone went looking" are different things to read in the channel.
     */
    public function execute(
        string $invoiceNumber,
        string $source = SendUxiolabsStatusNotificationAction::SOURCE_POLL,
    ): Transaction {
        $transaction = Transaction::where('invoice_number', $invoiceNumber)
            ->where('status', TransactionStatus::PROCESSING->value)
            ->firstOrFail();

        // /status only accepts uxiolabs's own invoice id. Without one (the
        // order response was lost mid-flight) there is nothing to poll — the
        // callback, which carries our idtrx, is the only path that can resolve
        // this transaction.
        if (! $transaction->supplier_trx_id) {
            throw new Exception('Transaksi belum memiliki ID order uxiolabs — menunggu callback dari supplier.');
        }

        // Read before the update: afterwards the row holds the new status and
        // can no longer say what it moved from.
        $oldStatus = $transaction->status;

        $response = $this->uxiolabsService->checkTransactionStatus($transaction->supplier_trx_id);

        $newStatus = $this->mapUxiolabsStatus($response['status'] ?? 'pending');
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
            $this->pointsAction->execute($fresh);
        }

        // This is the path that most orders actually finish on — the supplier
        // callback is unreliable enough that the poll chain exists to cover it —
        // and until now it was the one path that told the channel nothing.
        // Deduped against the callback, which may be reporting the same move.
        $this->announce->statusChanged($fresh, $oldStatus, $newStatus, $source);

        return $fresh;
    }
}
