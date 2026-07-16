<?php

namespace App\Actions\Financial;

use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Models\Payment;
use App\Models\Transaction;
use Carbon\CarbonInterface;

/**
 * Financial Summary stat cards (Credit/Debit/Profit) — same first-pass
 * definition and trend approach as GetDashboardStatsAction::statCard(), but
 * over a month window instead of a day: credit = this month's collected
 * payments, debit = this month's refunds, profit = this month's margin on
 * COMPLETED transactions. Pending a confirmed finance spec (deliberately
 * TBD per product_requirements.md) — revisit if settlement/fee rules land.
 */
class GetFinancialSummaryAction
{
    public function execute(): array
    {
        $monthStart = now()->startOfMonth();
        $lastMonthStart = now()->subMonthNoOverflow()->startOfMonth();

        $collected = Payment::where('status', PaymentStatus::SUCCESS->value)
            ->selectRaw('COALESCE(SUM(CASE WHEN paid_at >= ? THEN gross_amount ELSE 0 END),0) as this_month', [$monthStart])
            ->selectRaw('COALESCE(SUM(CASE WHEN paid_at >= ? AND paid_at < ? THEN gross_amount ELSE 0 END),0) as last_month', [$lastMonthStart, $monthStart])
            ->first();

        $refunded = Payment::where('status', PaymentStatus::REFUNDED->value)
            ->selectRaw('COALESCE(SUM(CASE WHEN paid_at >= ? THEN gross_amount ELSE 0 END),0) as this_month', [$monthStart])
            ->selectRaw('COALESCE(SUM(CASE WHEN paid_at >= ? AND paid_at < ? THEN gross_amount ELSE 0 END),0) as last_month', [$lastMonthStart, $monthStart])
            ->first();

        $profit = $this->marginBetween($monthStart, null);
        $lastMonthProfit = $this->marginBetween($lastMonthStart, $monthStart);

        return [
            $this->statCard('credit', (int) $collected->this_month, (int) $collected->last_month, 'Since last month'),
            $this->statCard('debit', (int) $refunded->this_month, (int) $refunded->last_month, 'Since last month'),
            $this->statCard('profit', $profit, $lastMonthProfit, 'Since last month'),
        ];
    }

    private function marginBetween(CarbonInterface $from, ?CarbonInterface $to): int
    {
        return (int) Transaction::where('status', TransactionStatus::COMPLETED->value)
            ->where('created_at', '>=', $from)
            ->when($to, fn ($q) => $q->where('created_at', '<', $to))
            ->sum('margin');
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
}
