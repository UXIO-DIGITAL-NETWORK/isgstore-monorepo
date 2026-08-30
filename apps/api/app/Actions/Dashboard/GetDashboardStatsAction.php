<?php

namespace App\Actions\Dashboard;

use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\TransactionStatus;
use App\Http\Resources\Api\Transaction\TransactionResource;
use App\Models\Payment;
use App\Models\RefundRequest;
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
    /**
     * @param  int|null  $month  1-12, to scope the chart to a specific month of
     *                           the current year. Null keeps the rolling
     *                           30-day window the dashboard opens on.
     */
    public function execute(?int $month = null): array
    {
        $todayStart = now()->startOfDay();
        $monthStart = now()->startOfMonth();
        $yesterdayStart = now()->subDay()->startOfDay();

        $collected = Payment::where('status', PaymentStatus::SUCCESS->value)
            ->selectRaw('COALESCE(SUM(gross_amount),0) as all_time')
            ->selectRaw('COALESCE(SUM(CASE WHEN paid_at >= ? THEN gross_amount ELSE 0 END),0) as this_month', [$monthStart])
            ->selectRaw('COALESCE(SUM(CASE WHEN paid_at >= ? THEN gross_amount ELSE 0 END),0) as today', [$todayStart])
            ->selectRaw('COALESCE(SUM(CASE WHEN paid_at >= ? AND paid_at < ? THEN gross_amount ELSE 0 END),0) as yesterday', [$yesterdayStart, $todayStart])
            ->first();

        // Dated by when the refund actually settled, not by the original
        // payment — a guest's manual transfer can land days later, and
        // "refunds today" must mean today's money out.
        $refunded = RefundRequest::where('status', RefundStatus::COMPLETED->value)
            ->selectRaw('COALESCE(SUM(CASE WHEN refunded_at >= ? THEN amount ELSE 0 END),0) as today', [$todayStart])
            ->selectRaw('COALESCE(SUM(CASE WHEN refunded_at >= ? AND refunded_at < ? THEN amount ELSE 0 END),0) as yesterday', [$yesterdayStart, $todayStart])
            ->first();

        $periods = [
            'today' => $this->periodStats($todayStart, (int) $collected->today),
            'this_month' => $this->periodStats($monthStart, (int) $collected->this_month),
            'all_time' => $this->periodStats(null, (int) $collected->all_time),
        ];
        $yesterdayRevenue = $this->periodStats($yesterdayStart, 0, $todayStart)['revenue'];

        return [
            'totals' => [
                'users' => User::count(),
                'transactions' => $periods['all_time']['count'],
            ],
            'periods' => $periods,
            // First-pass definitions pending a confirmed finance spec (mirrors
            // the "Credit/Debit/Profit" TBD noted for the Financial page):
            // credit = today's successfully collected payments, debit = today's
            // refunds, both trended against yesterday's same metric.
            'stat_cards' => [
                $this->statCard('credit', (int) $collected->today, (int) $collected->yesterday, 'Since yesterday'),
                $this->statCard('debit', (int) $refunded->today, (int) $refunded->yesterday, 'Since yesterday'),
                $this->statCard('todays_sales', $periods['today']['revenue'], $yesterdayRevenue, 'Since yesterday'),
            ],
            'pending_orders' => [
                'manual_orders' => Transaction::where('is_manual', true)
                    ->whereIn('status', [TransactionStatus::PENDING->value, TransactionStatus::PROCESSING->value])
                    ->count(),
                'pending_payment' => Transaction::where('status', TransactionStatus::PENDING->value)->count(),
                'processing' => Transaction::where('status', TransactionStatus::PROCESSING->value)->count(),
                'failed_transaction' => Transaction::where('status', TransactionStatus::FAILED_PROVIDER->value)->count(),
            ],
            'chart' => $this->chartSeries($month),
            'recent_transactions' => TransactionResource::collection(
                Transaction::with(['user', 'product.category', 'supplier', 'payment', 'paymentChannel'])
                    ->latest()
                    ->limit(10)
                    ->get()
            ),
        ];
    }

    private function statCard(string $key, int $value, int $previousValue, string $caption): array
    {
        $deltaPct = null;
        $direction = null;

        if ($previousValue > 0) {
            $pct = (($value - $previousValue) / $previousValue) * 100;
            $deltaPct = round(abs($pct), 1);
            $direction = $pct >= 0 ? 'up' : 'down';
        }

        return [
            'key' => $key,
            'value' => $value,
            'delta_pct' => $deltaPct,
            'direction' => $direction,
            'caption' => $caption,
        ];
    }

    /**
     * @return array{revenue:int, margin:int, collected:int, count:int, by_status:array<string,int>}
     */
    private function periodStats(?CarbonInterface $from, int $collected, ?CarbonInterface $to = null): array
    {
        // toBase(): skip model hydration so `status` stays a raw string
        // (the enum cast would break keyBy) and no casts run on aggregates.
        $rows = Transaction::query()
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('created_at', '<', $to))
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
    private function chartSeries(?int $month = null): array
    {
        $completed = TransactionStatus::COMPLETED->value;

        [$from, $to] = $month !== null
            ? [now()->setMonth($month)->startOfMonth(), now()->setMonth($month)->endOfMonth()]
            : [now()->subDays(29)->startOfDay(), now()->endOfDay()];

        return Transaction::whereBetween('created_at', [$from, $to])
            // net_income is margin, not revenue: the dashboard chart plots the
            // two against each other, and revenue alone says nothing about
            // whether the volume was profitable.
            ->selectRaw(
                'DATE(created_at) as date, COUNT(*) as transactions, '.
                'COALESCE(SUM(CASE WHEN status = ? THEN amount_total ELSE 0 END),0) as revenue, '.
                'COALESCE(SUM(CASE WHEN status = ? THEN margin ELSE 0 END),0) as net_income',
                [$completed, $completed]
            )
            ->groupBy('date')
            ->orderBy('date')
            ->toBase()
            ->get()
            ->map(fn ($row) => [
                'date' => (string) $row->date,
                'transactions' => (int) $row->transactions,
                'revenue' => (int) $row->revenue,
                'net_income' => (int) $row->net_income,
            ])
            ->all();
    }
}
