<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Transaction;
use App\Actions\Digiflazz\ProcessDigiflazzTransactionAction;
use Illuminate\Support\Facades\Log;
use Exception;

class ProcessDigiflazzTopup implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public Transaction $transaction)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(ProcessDigiflazzTransactionAction $digiflazzAction): void
    {
        try {
            // Update status to PROCESSING before hitting Digiflazz
            $this->transaction->update(['status' => 'PROCESSING']);

            // Trigger the Digiflazz top-up automatically via API
            $digiflazzAction->execute($this->transaction);

            // Once executed, Digiflazz webhook will eventually handle it, but if execute() is synchronous we might set to COMPLETED.
            // Digiflazz typically has its own webhook callback. We'll set it to COMPLETED if no exception,
            // or rely on WebhookDigiflazzController for async Digiflazz responses.
            $this->transaction->update(['status' => 'COMPLETED']);
        } catch (Exception $e) {
            $this->transaction->update(['status' => 'FAILED_PROVIDER']);
            Log::error('Digiflazz Execution Failed in Job', [
                'transaction_id' => $this->transaction->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
