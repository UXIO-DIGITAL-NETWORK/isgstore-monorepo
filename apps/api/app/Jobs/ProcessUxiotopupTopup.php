<?php

namespace App\Jobs;

use App\Actions\Refund\InitiateRefundAction;
use App\Actions\Transaction\SendTransactionReceiptAction;
use App\Actions\Uxiotopup\ProcessUxiotopupTransactionAction;
use App\Enums\ProviderStatus;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessUxiotopupTopup implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(public Transaction $transaction) {}

    public function handle(ProcessUxiotopupTransactionAction $uxiotopupAction): void
    {
        $this->transaction->update(['status' => TransactionStatus::PROCESSING]);

        try {
            $updated = $uxiotopupAction->execute($this->transaction);

            // Fulfilled by the supplier — email the receipt (idempotent).
            if ($updated->status === TransactionStatus::COMPLETED) {
                app(SendTransactionReceiptAction::class)->execute($updated);
            }
        } catch (Throwable $e) {
            Log::channel('uxiotopup')->error('ProcessUxiotopupTopup: attempt failed', [
                'transaction_id' => $this->transaction->id,
                'invoice_number' => $this->transaction->invoice_number,
                'attempt' => $this->attempts(),
                'tries' => $this->tries,
                'error' => $e->getMessage(),
            ]);

            // Re-throw without marking FAILED_PROVIDER — let the queue honour
            // $tries/$backoff. failed() below sets the terminal state only after
            // all retries are exhausted, preventing premature webhook skips.
            // (Duplicate-idtrx never reaches here — the action settles it to
            // PROCESSING, so a retried-but-placed order is never re-ordered.)
            throw $e;
        }
    }

    public function failed(Throwable $e): void
    {
        // Conditional, not unconditional: the webhook may have won the race and
        // already refunded this row. Writing FAILED_PROVIDER over REFUNDED
        // would un-say that the money went back, and quietly drop the order out
        // of the refund queue's filters.
        $fresh = $this->transaction->fresh() ?? $this->transaction;

        if ($fresh->status !== TransactionStatus::REFUNDED) {
            $fresh->update([
                'status' => TransactionStatus::FAILED_PROVIDER,
                // Not the REJECTED default: retries ran out without the supplier
                // ever giving us a verdict. That is worth retrying by hand; an
                // explicit cancel is not. Collapsing the two is what makes today's
                // FAILED_PROVIDER unactionable.
                'provider_status' => ProviderStatus::UNDELIVERED,
            ]);
        }

        // Retries exhausted: the customer paid but fulfilment never succeeded,
        // so refund them. The action is idempotent (locks + checks payment '3'
        // + a unique refund per transaction).
        app(InitiateRefundAction::class)->execute($fresh);

        Log::channel('uxiotopup')->error('ProcessUxiotopupTopup: all retries exhausted — marked FAILED_PROVIDER & refunded', [
            'transaction_id' => $this->transaction->id,
            'invoice_number' => $this->transaction->invoice_number,
            'error' => $e->getMessage(),
        ]);
    }
}
