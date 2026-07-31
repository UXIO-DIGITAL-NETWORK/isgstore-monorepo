<?php

declare(strict_types=1);

namespace App\Actions\Member;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Aggregates behind the member dashboard's stat tiles and "recent orders" table.
 *
 * One grouped query for the counts rather than one per status, so the tile row
 * costs a single round trip regardless of how many statuses exist.
 */
class GetMemberDashboardAction
{
    private const RECENT_LIMIT = 5;

    public function execute(User $user): array
    {
        $byStatus = Transaction::query()
            ->where('user_id', $user->id)
            ->groupBy('status')
            ->pluck(DB::raw('COUNT(*)'), 'status');

        $countFor = fn (TransactionStatus ...$statuses) => collect($statuses)
            ->sum(fn (TransactionStatus $status) => (int) ($byStatus[$status->value] ?? 0));

        return [
            'wallet' => [
                'balance' => (int) $user->balance,
                'points' => (int) $user->point,
            ],
            'stats' => [
                'total' => (int) $byStatus->sum(),
                'pending' => $countFor(TransactionStatus::PENDING),
                // "In process" spans everything paid but not yet delivered —
                // the customer sees one bucket, not three internal states.
                'process' => $countFor(TransactionStatus::PAID, TransactionStatus::PROCESSING),
                'success' => $countFor(TransactionStatus::COMPLETED),
                'failed' => $countFor(
                    TransactionStatus::FAILED_PROVIDER,
                    TransactionStatus::EXPIRED,
                    TransactionStatus::REFUNDED,
                ),
            ],
            // Only completed orders count as money spent: pending and failed
            // transactions were never captured.
            'total_spent' => (int) Transaction::query()
                ->where('user_id', $user->id)
                ->where('status', TransactionStatus::COMPLETED->value)
                ->sum('amount_total'),
            'recent_transactions' => (new ListMemberTransactionsAction)
                ->recent($user, self::RECENT_LIMIT),
        ];
    }
}
