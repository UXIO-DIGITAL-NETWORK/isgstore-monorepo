<?php

declare(strict_types=1);

namespace App\Queries;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * One paginated feed over two tables: the client's sales (`transactions`,
 * money IN) and the service bills kita issues them (`service_invoices`, money
 * OUT).
 *
 * Not an Action: it mutates nothing, opens no transaction, and must hand a
 * Builder back so the caller can `paginate()`. Two controllers share it, which
 * is the only reason it is not inlined.
 *
 * `direction` is client-relative in BOTH roles ("in" = money into the client),
 * because the internal table's "Nett Merchant" column already reads that way.
 */
final class UnifiedTransactionQuery
{
    public const TYPE_ALL = 'all';

    public const TYPE_SALE = 'sale';

    public const TYPE_SERVICE = 'service';

    /**
     * Coarse status buckets that power the summary pills and the "Status"
     * dropdown. One bucket spans both status vocabularies — `transactions`
     * (App\Enums\TransactionStatus) and `service_invoices`
     * (App\Enums\ServiceInvoiceStatus) — so the same filter reads across the
     * merged feed. A raw `status` filter still works for an exact match.
     */
    public const STATUS_GROUPS = [
        'success' => ['COMPLETED', 'PAID'],
        'pending' => ['PENDING', 'PROCESSING', 'WAITING_CONFIRMATION', 'UNPAID'],
        'failed' => ['FAILED_PROVIDER', 'EXPIRED', 'REJECTED', 'CANCELLED', 'REFUNDED'],
    ];

    public function __construct(
        /** null = every client (the internal view). */
        private readonly ?int $merchantId = null,
        /** Adds the fee/profit columns. Omitted entirely from the SQL otherwise,
         *  so even a careless raw return cannot leak them to a merchant. */
        private readonly bool $withPlatformFigures = false,
        /** Inclusive lower/upper bound on the row's created date (Y-m-d). */
        private readonly ?string $startDate = null,
        private readonly ?string $endDate = null,
    ) {}

    public function build(string $type, ?string $status = null, ?string $search = null, ?string $statusGroup = null): Builder
    {
        return DB::query()
            ->fromSub($this->baseUnion($type, $status, $search, $statusGroup), 'tx')
            ->orderByDesc('occurred_at')
            // Deterministic tiebreak: two rows written in the same second must
            // not swap places between page 1 and page 2.
            ->orderByDesc('source')
            ->orderByDesc('source_id');
    }

    /**
     * Aggregates for the summary pills and the Recap dialog. Honours every
     * filter EXCEPT the status bucket — the pills must show the full status
     * distribution of the current search/type/date/merchant scope, otherwise
     * clicking "Failed" would zero out the "Success" count it sits next to.
     *
     * @return array<string, int>
     */
    public function summary(string $type = self::TYPE_ALL, ?string $search = null): array
    {
        $base = $this->baseUnion($type, null, $search, null);

        $inList = fn (string $group): string => "'".implode("','", self::STATUS_GROUPS[$group])."'";

        $select = [
            DB::raw('COUNT(*) as count_total'),
            DB::raw("SUM(CASE WHEN status IN ({$inList('success')}) THEN 1 ELSE 0 END) as count_success"),
            DB::raw("SUM(CASE WHEN status IN ({$inList('pending')}) THEN 1 ELSE 0 END) as count_pending"),
            DB::raw("SUM(CASE WHEN status IN ({$inList('failed')}) THEN 1 ELSE 0 END) as count_failed"),
            DB::raw('COALESCE(SUM(amount), 0) as amount_total'),
        ];

        if ($this->withPlatformFigures) {
            $select = array_merge($select, [
                DB::raw('COALESCE(SUM(amount_total), 0) as gross_total'),
                DB::raw('COALESCE(SUM(admin_fee), 0) as admin_fee_total'),
                DB::raw('COALESCE(SUM(gateway_fee), 0) as gateway_fee_total'),
                DB::raw('COALESCE(SUM(platform_profit), 0) as platform_profit_total'),
            ]);
        }

        $row = DB::query()->fromSub($base, 'tx')->select($select)->first();

        $out = [
            'count_total' => (int) ($row->count_total ?? 0),
            'count_success' => (int) ($row->count_success ?? 0),
            'count_pending' => (int) ($row->count_pending ?? 0),
            'count_failed' => (int) ($row->count_failed ?? 0),
            'amount_total' => (int) ($row->amount_total ?? 0),
        ];

        if ($this->withPlatformFigures) {
            $out['gross_total'] = (int) ($row->gross_total ?? 0);
            $out['admin_fee_total'] = (int) ($row->admin_fee_total ?? 0);
            $out['gateway_fee_total'] = (int) ($row->gateway_fee_total ?? 0);
            $out['platform_profit_total'] = (int) ($row->platform_profit_total ?? 0);
        }

        return $out;
    }

    /**
     * The merged, un-paginated leg(s) every caller starts from. Union only for
     * "Semua"; a single-type tab hits one table directly so the
     * (merchant_id, created_at) index can actually be used.
     */
    private function baseUnion(string $type, ?string $status, ?string $search, ?string $statusGroup): Builder
    {
        return match ($type) {
            self::TYPE_SALE => $this->salesLeg($status, $search, $statusGroup),
            self::TYPE_SERVICE => $this->serviceLeg($status, $search, $statusGroup),
            default => $this->salesLeg($status, $search, $statusGroup)
                ->unionAll($this->serviceLeg($status, $search, $statusGroup)),
        };
    }

    /**
     * Both legs must emit the SAME column names in the SAME order. A mismatch
     * does not error on MySQL — it silently transposes values — so the two
     * select lists are built here, next to each other, and never edited apart.
     */
    private function salesLeg(?string $status, ?string $search, ?string $statusGroup): Builder
    {
        $columns = [
            DB::raw("'sale' as source"),
            't.id as source_id',
            't.invoice_number as invoice_number',
            'p.name as title',
            DB::raw("'in' as direction"),
            't.amount_base as amount',
            // `transactions.status` is a native MySQL ENUM while the other leg
            // is a VARCHAR; cast rather than lean on union type-widening.
            DB::raw('CAST(t.status AS CHAR) as status'),
            'pc.name as channel',
            't.merchant_id as merchant_id',
            'm.name as merchant_name',
            't.created_at as occurred_at',
        ];

        if ($this->withPlatformFigures) {
            $columns = array_merge($columns, [
                't.amount_total as amount_total',
                't.channel_fee as admin_fee',
                DB::raw('COALESCE(pay.gateway_fee, 0) as gateway_fee'),
                DB::raw('(t.amount_fee - COALESCE(pay.gateway_fee, 0)) as platform_profit'),
            ]);
        }

        $query = DB::table('transactions as t')
            ->leftJoin('products as p', 'p.id', '=', 't.product_id')
            ->leftJoin('payment_channels as pc', 'pc.id', '=', 't.payment_channel_id')
            ->leftJoin('users as m', 'm.id', '=', 't.merchant_id')
            ->select($columns);

        if ($this->withPlatformFigures) {
            $query->leftJoin('payments as pay', 'pay.transaction_id', '=', 't.id');
        }

        // A sale with no merchant is a platform-owned sale — it belongs to
        // nobody's client feed, so it is excluded from the internal view too
        // rather than showing up with an empty Client column.
        $query->whereNotNull('t.merchant_id');

        if ($this->merchantId !== null) {
            $query->where('t.merchant_id', $this->merchantId);
        }

        $this->applyFilters($query, 't.status', 't.created_at', $status, $search, $statusGroup, 't.invoice_number');

        return $query;
    }

    private function serviceLeg(?string $status, ?string $search, ?string $statusGroup): Builder
    {
        $columns = [
            DB::raw("'service' as source"),
            'si.id as source_id',
            'si.invoice_number as invoice_number',
            'si.service_name as title',
            DB::raw("'out' as direction"),
            'si.amount as amount',
            'si.status as status',
            DB::raw('NULL as channel'),
            'si.merchant_id as merchant_id',
            'm.name as merchant_name',
            'si.created_at as occurred_at',
        ];

        if ($this->withPlatformFigures) {
            $columns = array_merge($columns, [
                'si.amount as amount_total',
                // A service bill carries no payment channel and no gateway, so
                // both fees are genuinely zero and the whole amount is kita's.
                DB::raw('0 as admin_fee'),
                DB::raw('0 as gateway_fee'),
                'si.amount as platform_profit',
            ]);
        }

        $query = DB::table('service_invoices as si')
            ->leftJoin('users as m', 'm.id', '=', 'si.merchant_id')
            ->select($columns);

        if ($this->merchantId !== null) {
            $query->where('si.merchant_id', $this->merchantId);
        }

        $this->applyFilters($query, 'si.status', 'si.created_at', $status, $search, $statusGroup, 'si.invoice_number');

        return $query;
    }

    /** Shared per-leg filters, kept identical across both legs. */
    private function applyFilters(
        Builder $query,
        string $statusColumn,
        string $createdColumn,
        ?string $status,
        ?string $search,
        ?string $statusGroup,
        string $invoiceColumn,
    ): void {
        if ($status) {
            $query->where($statusColumn, $status);
        }

        if ($statusGroup && isset(self::STATUS_GROUPS[$statusGroup])) {
            $query->whereIn($statusColumn, self::STATUS_GROUPS[$statusGroup]);
        }

        if ($search) {
            $query->where($invoiceColumn, 'like', $this->like($search));
        }

        if ($this->startDate) {
            $query->whereDate($createdColumn, '>=', $this->startDate);
        }

        if ($this->endDate) {
            $query->whereDate($createdColumn, '<=', $this->endDate);
        }
    }

    private function like(string $term): string
    {
        return '%'.str_replace('%', '\%', $term).'%';
    }
}
