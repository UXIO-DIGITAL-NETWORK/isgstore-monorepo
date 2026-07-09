<?php

namespace App\Jobs;

use App\Actions\Digiflazz\ProcessDigiflazzBillPaymentAction;
use App\Actions\Payment\RefundFailedTransactionAction;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessDigiflazzBillPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(public Transaction $transaction) {}

    public function handle(ProcessDigiflazzBillPaymentAction $action): void
    {
        $this->transaction->update(['status' => TransactionStatus::PROCESSING]);

        try {
            $action->execute($this->transaction);
        } catch (Throwable $e) {
            Log::error('ProcessDigiflazzBillPayment: attempt failed', [
                'transaction_id' => $this->transaction->id,
                'invoice_number' => $this->transaction->invoice_number,
                'attempt' => $this->attempts(),
                'tries' => $this->tries,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function failed(Throwable $e): void
    {
        $this->transaction->update(['status' => TransactionStatus::FAILED_PROVIDER]);

        // Retries exhausted: the customer paid but fulfilment never succeeded,
        // so refund them. The action is idempotent (locks + checks payment '3').
        app(RefundFailedTransactionAction::class)->execute($this->transaction);

        Log::error('ProcessDigiflazzBillPayment: all retries exhausted — marked FAILED_PROVIDER & refunded', [
            'transaction_id' => $this->transaction->id,
            'invoice_number' => $this->transaction->invoice_number,
            'error' => $e->getMessage(),
        ]);
    }
}
