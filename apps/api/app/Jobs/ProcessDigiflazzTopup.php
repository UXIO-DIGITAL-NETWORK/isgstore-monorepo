<?php

namespace App\Jobs;

use App\Actions\Digiflazz\ProcessDigiflazzTransactionAction;
use App\Models\Transaction;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessDigiflazzTopup implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 30; // seconds between retries

    public function __construct(public Transaction $transaction) {}

    public function handle(ProcessDigiflazzTransactionAction $digiflazzAction): void
    {
        // Mark in-flight so the Digiflazz webhook idempotency guard skips concurrent duplicates
        $this->transaction->update(['status' => 'PROCESSING']);

        try {
            // Action handles the API call and writes the final status
            // (COMPLETED, FAILED_PROVIDER, or PROCESSING if Digiflazz returns Pending)
            $digiflazzAction->execute($this->transaction);
        } catch (Exception $e) {
            // Infrastructure failure (network, no active supplier) — mark failed and log
            $this->transaction->update(['status' => 'FAILED_PROVIDER']);

            Log::error('ProcessDigiflazzTopup: Execution failed', [
                'transaction_id'  => $this->transaction->id,
                'invoice_number'  => $this->transaction->invoice_number,
                'error'           => $e->getMessage(),
            ]);

            // Re-throw so Laravel Queue records the failure and honours $tries/$backoff
            throw $e;
        }
    }
}
