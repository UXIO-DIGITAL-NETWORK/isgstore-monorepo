<?php

declare(strict_types=1);

namespace App\Actions\Report;

use App\DTOs\Report\ReportSummaryDTO;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Support\Report\PeriodRange;
use App\Support\Report\PeriodResolver;
use Illuminate\Database\Eloquent\Builder;

/**
 * Consolidated revenue / transactions / profit for the reporting hub, broken
 * down per product and per payment channel, over a window resolved in the
 * requesting admin's timezone.
 *
 * Aggregation happens in SQL. The previous implementation hydrated every
 * completed transaction and folded it in a PHP Collection, which was invisible
 * for "today" and a memory problem the moment a yearly period existed.
 */
class GetReportSummaryAction
{
    /** Breakdown rows returned before the tail is folded into a single "Others" row. */
    private const MAX_BREAKDOWN_ROWS = 20;

    public function __construct(private readonly PeriodResolver $periods) {}

    public function execute(ReportSummaryDTO $dto): array
    {
        $range = $this->periods->resolve($dto->period, $dto->dateFrom, $dto->dateTo, $dto->timezone);

        // Authoritative on its own rather than summed from a breakdown: once a
        // breakdown is capped (see MAX_BREAKDOWN_ROWS) or joins imperfectly,
        // deriving the header from it produces a report whose rows do not add
        // up to their own total.
        $totals = $this->base($range)
            ->selectRaw('COUNT(*) as row_count')
            ->selectRaw('COALESCE(SUM(transactions.amount_total), 0) as revenue')
            ->selectRaw('COALESCE(SUM(transactions.margin), 0) as profit')
            ->first();

        $products = $this->breakdown(
            $range,
            'products',
            'transactions.product_id',
            'products.name',
            'Unknown',
        );

        // payment_channel_id is nullable: a balance-paid order has no channel.
        // "Balance" is the honest label for that group — PaymentChannel's own
        // docblock notes balance is deliberately not a storefront channel.
        $channels = $this->breakdown(
            $range,
            'payment_channels',
            'transactions.payment_channel_id',
            'payment_channels.name',
            'Balance',
        );

        return [
            'period' => $range->period,
            'timezone' => $range->timezone,
            'label' => $range->label,
            'start_at' => $range->start->toIso8601ZuluString(),
            'end_at' => $range->endExclusive->toIso8601ZuluString(),
            'total_revenue' => (int) ($totals->revenue ?? 0),
            'total_transactions' => (int) ($totals->row_count ?? 0),
            'total_profit' => (int) ($totals->profit ?? 0),
            // `breakdown` is kept as an alias of the product breakdown for one
            // release so the admin panel does not need a lockstep deploy.
            'breakdown' => $products,
            'product_breakdown' => $products,
            'channel_breakdown' => $channels,
        ];
    }

    private function base(PeriodRange $range): Builder
    {
        return Transaction::query()
            ->where('transactions.status', TransactionStatus::COMPLETED->value)
            ->where('transactions.created_at', '>=', $range->start)
            ->where('transactions.created_at', '<', $range->endExclusive);
    }

    /**
     * One GROUP BY per dimension, left-joined so a null or unresolvable
     * foreign key keeps its revenue in the report instead of dropping the row
     * — SUM(breakdown.revenue) must always equal total_revenue.
     */
    private function breakdown(
        PeriodRange $range,
        string $table,
        string $foreignKey,
        string $nameColumn,
        string $nullLabel,
    ): array {
        $rows = $this->base($range)
            ->leftJoin($table, "{$table}.id", '=', $foreignKey)
            // Group by the real columns, not by COALESCE(...): MySQL's
            // ONLY_FULL_GROUP_BY rejects grouping on an expression that is not
            // also what it sees in the select list.
            ->groupBy("{$table}.id", $nameColumn)
            ->selectRaw("COALESCE({$nameColumn}, ?) as label", [$nullLabel])
            ->selectRaw('COUNT(*) as row_count')
            ->selectRaw('COALESCE(SUM(transactions.amount_total), 0) as revenue')
            ->selectRaw('COALESCE(SUM(transactions.margin), 0) as profit')
            // The old Collection groupBy returned insertion order, which was
            // effectively arbitrary between runs.
            ->orderByDesc('revenue')
            ->get();

        $mapped = $rows->map(fn ($row) => [
            'label' => (string) $row->label,
            'count' => (int) $row->row_count,
            'revenue' => (int) $row->revenue,
            // The header shows Net Profit; without this the rows cannot explain it.
            'profit' => (int) $row->profit,
        ]);

        if ($mapped->count() <= self::MAX_BREAKDOWN_ROWS) {
            return $mapped->values()->all();
        }

        $head = $mapped->take(self::MAX_BREAKDOWN_ROWS);
        $tail = $mapped->slice(self::MAX_BREAKDOWN_ROWS);

        return $head->push([
            'label' => 'Others',
            'count' => (int) $tail->sum('count'),
            'revenue' => (int) $tail->sum('revenue'),
            'profit' => (int) $tail->sum('profit'),
        ])->values()->all();
    }
}
