<?php

declare(strict_types=1);

namespace App\Actions\Points;

use App\Enums\TransactionStatus;
use App\Models\PointLedgerEntry;
use App\Models\Transaction;
use App\Support\Points\PointLedger;
use App\Support\Points\PointRules;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Credit the points a completed order earned.
 *
 * **Called explicitly at each COMPLETED site, never from an observer.** Two
 * reasons specific to this codebase: `saveQuietly()` bypasses observers, which
 * is tolerable for a bookkeeping column and not for granting something worth
 * money; and the precedent already exists — `SendTransactionReceiptAction` is
 * called by hand at the same four places. Putting this next to it means whoever
 * adds a fifth site sees both.
 *
 * Points land only at COMPLETED — payment settled **and** the supplier
 * delivered. A failed order therefore never produces points that would have to
 * be taken back.
 */
class GrantTransactionPointsAction
{
    public const TYPE = 'earn';

    public function execute(Transaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            /** @var Transaction|null $locked */
            $locked = Transaction::with('product')
                ->whereKey($transaction->getKey())
                ->lockForUpdate()
                ->first();

            if (! $locked || $locked->status !== TransactionStatus::COMPLETED) {
                return;
            }

            // Guests have no balance to credit.
            if (! $locked->user_id) {
                return;
            }

            // The fast path. The unique index below is the actual guarantee.
            if (PointLedgerEntry::where('transaction_id', $locked->id)->where('type', self::TYPE)->exists()) {
                return;
            }

            // The discounted selling price, minus whatever points already paid
            // for: no points on the channel fee, and no points earned on points.
            $base = (int) $locked->amount_base - (int) $locked->points_spent_amount;

            $earned = PointRules::earnedFor($locked->product, $base);

            if ($earned <= 0) {
                return;
            }

            try {
                PointLedger::record(
                    user: $locked->user_id,
                    amount: $earned,
                    type: self::TYPE,
                    transactionId: $locked->id,
                    reference: $locked->invoice_number,
                    description: "Poin dari {$locked->invoice_number}",
                );
            } catch (QueryException $e) {
                // Unique (transaction_id, type): another caller granted it
                // between the check and the insert. Already done, not an error.
                Log::info("Points already granted for {$locked->invoice_number}");

                return;
            }

            $locked->forceFill(['points_earned' => $earned])->save();
        });
    }
}
