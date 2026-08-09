<?php

namespace App\Actions\Transaction;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Support\Carbon;

/**
 * Daily/monthly recap: completed transactions in the period, grouped per
 * product, with a totals footer. Revenue is the amount the customer paid
 * (`amount_total`); the admin uses this for the downloadable recap report.
 */
class GetTransactionRecapAction
{
    public function execute(string $period = 'daily'): array
    {
        $now = Carbon::now();
        [$start, $end] = $period === 'monthly'
            ? [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()]
            : [$now->copy()->startOfDay(), $now->copy()->endOfDay()];

        $rows = Transaction::query()
            ->where('status', TransactionStatus::COMPLETED->value)
            ->whereBetween('created_at', [$start, $end])
            ->with('product:id,name')
            ->get(['id', 'product_id', 'amount_total']);

        $breakdown = $rows
            ->groupBy(fn ($t) => $t->product?->name ?? 'Unknown')
            ->map(fn ($group, $label) => [
                'label' => $label,
                'count' => $group->count(),
                'revenue' => (int) $group->sum('amount_total'),
            ])
            ->values()
            ->all();

        return [
            'period' => $period === 'monthly' ? 'monthly' : 'daily',
            'generated_at' => $now->toIso8601String(),
            'breakdown' => $breakdown,
            'total_count' => $rows->count(),
            'total_revenue' => (int) $rows->sum('amount_total'),
        ];
    }
}
