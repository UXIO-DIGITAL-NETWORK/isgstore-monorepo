<?php

namespace App\Actions\Dashboard;

use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Http\Resources\Api\Transaction\TransactionResource;
use App\Models\Payment;
use App\Models\Transaction;
use App\Models\User;
use Carbon\CarbonInterface;

/**
 * Read-only dashboard aggregates for the admin frontend.
 *
 * revenue/margin are summed from COMPLETED transactions by created_at;
 * collected is summed from SUCCESS payments by paid_at — the two can differ
 * (a paid order may still be PROCESSING) and that difference is meaningful.
 */
class GetDashboardStatsAction
{
    public function execute(): array
    {
        $todayStart = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        $collected = Payment::where('status', PaymentStatus::SUCCESS->value)
            ->selectRaw('COALESCE(SUM(gross_amount),0) as all_time')
            ->selectRaw('COALESCE(SUM(CASE WHEN paid_at >= ? THEN gross_amount ELSE 0 END),0) as this_month', [$monthStart])
            ->selectRaw('COALESCE(SUM(CASE WHEN paid_at >= ? THEN gross_amount ELSE 0 END),0) as today', [$todayStart])
            ->first();

        $periods = [
            'today' => $this->periodStats($todayStart, (int) $collected->today),
            'this_month' => $this->periodStats($monthStart, (int) $collected->this_month),
            'all_time' => $this->periodStats(null, (int) $collected->all_time),
        ];

        return [
            'totals' => [
                'users' => User::count(),
                'transactions' => $periods['all_time']['count'],
            ],
            'periods' => $periods,
            'chart' => $this->chartSeries(),
            'recent_transactions' => TransactionResource::collection(
                Transaction::with(['user', 'product', 'supplier', 'payment', 'paymentChannel'])
                    ->latest()
                    ->limit(10)
                    ->get()
            ),
        ];
    }

    /**
     * @return array{revenue:int, margin:int, collected:int, count:int, by_status:array<string,int>}
     */
    private function periodStats(?CarbonInterface $from, int $collected): array
    {
        // toBase(): skip model hydration so `status` stays a raw string
        // (the enum cast would break keyBy) and no casts run on aggregates.
        $rows = Transaction::query()
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->selectRaw('status, COUNT(*) as cnt, COALESCE(SUM(amount_total),0) as amount, COALESCE(SUM(margin),0) as margin')
            ->groupBy('status')
            ->toBase()
            ->get()
            ->keyBy('status');

        $byStatus = [];
        foreach (TransactionStatus::cases() as $case) {
            $byStatus[$case->value] = (int) ($rows[$case->value]->cnt ?? 0);
        }

        $completed = $rows[TransactionStatus::COMPLETED->value] ?? null;

        return [
            'revenue' => (int) ($completed->amount ?? 0),
            'margin' => (int) ($completed->margin ?? 0),
            'collected' => $collected,
            'count' => array_sum($byStatus),
            'by_status' => $byStatus,
        ];
    }

    /**
     * @return array<int,array{date:string, transactions:int, revenue:int}>
     */
    private function chartSeries(): array
    {
        $completed = TransactionStatus::COMPLETED->value;

        return Transaction::where('created_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw('DATE(created_at) as date, COUNT(*) as transactions, COALESCE(SUM(CASE WHEN status = ? THEN amount_total ELSE 0 END),0) as revenue', [$completed])
            ->groupBy('date')
            ->orderBy('date')
            ->toBase()
            ->get()
            ->map(fn ($row) => [
                'date' => (string) $row->date,
                'transactions' => (int) $row->transactions,
                'revenue' => (int) $row->revenue,
            ])
            ->all();
    }
}
