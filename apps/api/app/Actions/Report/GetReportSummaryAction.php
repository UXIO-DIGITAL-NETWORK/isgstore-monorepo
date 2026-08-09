<?php

namespace App\Actions\Report;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Support\Carbon;

/**
 * Consolidated revenue / transactions / profit for the reporting hub, with a
 * per-product breakdown. Scoped to completed transactions in the selected
 * period (daily = today, monthly = current month).
 */
class GetReportSummaryAction
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
            ->get(['id', 'product_id', 'amount_total', 'margin']);

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
            'total_revenue' => (int) $rows->sum('amount_total'),
            'total_transactions' => $rows->count(),
            'total_profit' => (int) $rows->sum('margin'),
            'breakdown' => $breakdown,
        ];
    }
}
