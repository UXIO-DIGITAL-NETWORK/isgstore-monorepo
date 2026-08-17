<?php

namespace App\Console\Commands;

use App\Actions\Settlement\SettleMerchantTransactionAction;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Console\Command;
use Throwable;

/**
 * Books the merchant/platform settlement for paid transactions that were
 * attributed to a merchant only after the fact (the merchant_id backfill).
 *
 * Deliberately opt-in, not run by the migration: it moves real balances — the
 * client's withdrawable saldo and kita's profit account. The underlying action
 * is idempotent (a `settlement` mutation keyed on invoice number), so re-running
 * is safe and already-settled transactions are skipped.
 */
class SettlePaymentBackfillCommand extends Command
{
    protected $signature = 'payment:settle-backfill {--dry-run : Report how many would settle without moving any balance}';

    protected $description = 'Settle paid, merchant-attributed transactions that were never split between the client and the platform.';

    public function handle(SettleMerchantTransactionAction $settle): int
    {
        $query = Transaction::query()
            ->whereNotNull('merchant_id')
            ->whereIn('status', TransactionStatus::paidStates())
            ->with('payment');

        $total = (int) $query->clone()->count();

        if ($this->option('dry-run')) {
            $this->info("Dry run: {$total} paid transaction(s) eligible for settlement.");

            return self::SUCCESS;
        }

        $settled = 0;

        $query->chunkById(200, function ($transactions) use ($settle, &$settled) {
            foreach ($transactions as $transaction) {
                try {
                    $settle->execute($transaction);
                    $settled++;
                } catch (Throwable $e) {
                    $this->error("Failed to settle {$transaction->invoice_number}: {$e->getMessage()}");
                }
            }
        });

        $this->info("Processed {$settled}/{$total} paid transaction(s) (already-settled ones are no-ops).");

        return self::SUCCESS;
    }
}
