<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Support\Storefront\Mask;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Top spenders over a rolling window.
 *
 * Deliberately NOT built on `user_spendings`: that table is keyed on
 * `date('Y-m')` / `ALL_TIME` (see RecordUserSpendingAction), which cannot answer
 * "today" or "this week". Aggregating completed transactions directly gives the
 * three windows the public page actually offers.
 *
 * Names are masked — this page is unauthenticated.
 */
class GetPublicLeaderboardAction
{
    private const LIMIT = 20;

    /** @return list<array<string, mixed>> */
    public function execute(string $period): array
    {
        return Transaction::query()
            ->join('users', 'users.id', '=', 'transactions.user_id')
            ->where('transactions.status', TransactionStatus::COMPLETED->value)
            ->when($this->since($period), fn ($q, CarbonInterface $since) => $q->where('transactions.created_at', '>=', $since))
            ->groupBy('users.id', 'users.name', 'users.username')
            ->orderByRaw('SUM(transactions.amount_total) DESC')
            ->limit(self::LIMIT)
            ->get([
                'users.id as user_id',
                'users.name as name',
                'users.username as username',
                DB::raw('SUM(transactions.amount_total) as total_amount'),
                DB::raw('COUNT(transactions.id) as total_orders'),
            ])
            ->values()
            ->map(fn ($row, int $index) => [
                'rank' => $index + 1,
                'player_name' => Mask::name($row->username ?: $row->name),
                'total_amount' => (int) $row->total_amount,
                'total_orders' => (int) $row->total_orders,
            ])
            ->all();
    }

    private function since(string $period): ?CarbonInterface
    {
        return match ($period) {
            'today' => Carbon::today(),
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            default => null,
        };
    }
}
