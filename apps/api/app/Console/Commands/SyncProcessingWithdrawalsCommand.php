<?php

namespace App\Console\Commands;

use App\Actions\Withdrawal\HandleDisbursementCallbackAction;
use App\DTOs\Withdrawal\DisbursementCallbackDTO;
use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use App\Services\Payment\MonetapayService;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * The recovery half of the payout flow: a PROCESSING withdrawal whose Monetapay
 * callback (7.4.2) was lost stays stuck forever. Poll the payout inquiry (7.4.1)
 * for those rows and drive them to their real terminal state through the SAME
 * callback handler — so the settle/refund + idempotency logic is never forked.
 */
class SyncProcessingWithdrawalsCommand extends Command
{
    protected $signature = 'withdrawals:sync-processing
        {--dry-run : Show what would be updated without writing to the database}';

    protected $description = 'Query Monetapay for stuck PROCESSING payouts and sync their real status.';

    public function __construct(
        private readonly MonetapayService $monetapay,
        private readonly HandleDisbursementCallbackAction $callbackAction,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        // Give the async callback a couple of minutes before polling, so a
        // freshly-accepted payout isn't inquired the instant it is created.
        $withdrawals = Withdrawal::where('status', WithdrawalStatus::PROCESSING->value)
            ->where('updated_at', '<=', now()->subMinutes(2))
            ->get();

        if ($withdrawals->isEmpty()) {
            $this->info('No stuck PROCESSING withdrawals found.');

            return self::SUCCESS;
        }

        $this->info("Found {$withdrawals->count()} PROCESSING withdrawal(s). Querying Monetapay...");
        $counts = ['resolved' => 0, 'waiting' => 0, 'errors' => 0];

        foreach ($withdrawals as $withdrawal) {
            $counts[$this->sync($withdrawal, $dry)]++;
        }

        $this->table(
            ['Outcome', 'Count'],
            collect($counts)->map(fn ($v, $k) => [ucfirst($k), $v])->values()->toArray()
        );

        return self::SUCCESS;
    }

    private function sync(Withdrawal $withdrawal, bool $dry): string
    {
        $ref = $withdrawal->withdrawal_number;

        try {
            $response = $this->monetapay->inquiryDisbursement(['mch_order_no' => $ref]);

            if (($response['code'] ?? -1) !== 0) {
                $this->warn("  SKIP  {$ref} — inquiry failed: ".($response['message'] ?? 'unknown'));

                return 'errors';
            }

            $data = $response['data'] ?? [];
            $status = (string) ($data['status'] ?? '');

            // Monetapay payout status: 0 Processing / 1 Successful / 2 Failed.
            if ($status === '' || $status === '0') {
                $this->line("  WAIT  {$ref} — still processing.");

                return 'waiting';
            }

            $this->line("  RESOLVE {$ref} — Monetapay status: {$status}");

            if (! $dry) {
                // Same handler the callback uses — settle/refund + idempotency shared.
                $this->callbackAction->execute(new DisbursementCallbackDTO(
                    outNo: $ref,
                    status: $status,
                    rawPayload: $data,
                ));
            }

            return 'resolved';
        } catch (Exception $e) {
            $this->error("  ERROR {$ref} — {$e->getMessage()}");
            Log::channel('monetapay')->error('withdrawals:sync-processing exception', [
                'withdrawal_number' => $ref,
                'error' => $e->getMessage(),
            ]);

            return 'errors';
        }
    }
}
