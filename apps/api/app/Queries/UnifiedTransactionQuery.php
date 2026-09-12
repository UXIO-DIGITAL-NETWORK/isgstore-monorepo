<?php

declare(strict_types=1);

namespace App\Queries;

use App\Enums\GatewayStatus;
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
            // The two halves `status` conflates, exposed apart. Kept adjacent and
            // in the SAME position on both legs — see the note above.
            't.provider_status as provider_status',
            // A correlated subquery, NOT a join. `payments.transaction_id` is
            // indexed but not unique (nothing enforces the "1 transaction = 1
            // payment" the column comment claims), so an unconditional join could
            // multiply sales rows and quietly inflate the merchant's totals. A
            // scalar subquery cannot change either leg's row count.
            DB::raw('(SELECT '.GatewayStatus::sqlCaseForPayments('p2')
                .' FROM payments p2 WHERE p2.transaction_id = t.id'
                .' ORDER BY p2.id DESC LIMIT 1) as payment_status'),
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
                // Profit Kita = admin fee − gateway cut − tax (PPN) on the fee;
                // matches the ledger booked in SettleMerchantTransactionAction.
                DB::raw('(t.amount_fee - COALESCE(pay.gateway_fee, 0) - COALESCE(pay.tax_amount, 0)) as platform_profit'),
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
            // A service bill has no topup provider at all — null is the honest
            // answer, and the UI renders it as a dash rather than a blank badge.
            DB::raw('NULL as provider_status'),
            // But a bill DOES have a payment lifecycle; `si.status` is it, just
            // in a different alphabet. Mapping it beats two empty columns on
            // every service row, which would read as a bug.
            DB::raw(GatewayStatus::sqlCaseForServiceInvoices('si').' as payment_status'),
            DB::raw('NULL as channel'),
            'si.merchant_id as merchant_id',
            'm.name as merchant_name',
            'si.created_at as occurred_at',
        ];

        if ($this->withPlatformFigures) {
            $columns = array_merge($columns, [
                // What the client was actually charged: the bill plus whatever
                // the payment channel took on top. Falls back to the bill for
                // rows settled by hand, which have no gateway attempt.
                //
                // Read from the PIVOT, never from the attempt. One attempt may
                // settle several bills, so `sip.total` and `sip.admin_fee` are
                // the BATCH's figures: joined per invoice they would report the
                // whole batch against each of its bills, in a screen the client
                // reads, and the statement would not sum to what they paid.
                DB::raw('COALESCE(sipi.amount + sipi.admin_fee, si.amount) as amount_total'),
                DB::raw('COALESCE(sipi.admin_fee, 0) as admin_fee'),
                // Not read from the callback anywhere yet — same open item as
                // `payments.gateway_fee`.
                DB::raw('0 as gateway_fee'),
                // The bill itself. The admin fee covers the gateway's cut and
                // is not kita's margin, so it must not be counted as profit.
                'si.amount as platform_profit',
            ]);
        }

        $query = DB::table('service_invoices as si')
            ->leftJoin('users as m', 'm.id', '=', 'si.merchant_id')
            // What the settling attempt charged FOR THIS BILL, reached through
            // the pivot: a batch attempt has no `service_invoice_id`, so joining
            // the FK would make it invisible on every bill it actually paid.
            //
            // Grouped rather than joined directly. A bill can carry several
            // attempts (an expired QR, then a fresh one), and a plain join would
            // emit the invoice once per attempt — the same bill repeated in the
            // client's feed. `PAID` only: an expired attempt charged nobody
            // anything.
            ->leftJoin(DB::raw(
                '(select pi.service_invoice_id, '
                .'min(pi.amount) as amount, min(pi.admin_fee) as admin_fee '
                .'from service_invoice_payment_items pi '
                .'inner join service_invoice_payments p '
                ."on p.id = pi.service_invoice_payment_id and p.status = 'PAID' "
                .'group by pi.service_invoice_id) as sipi'
            ), 'sipi.service_invoice_id', '=', 'si.id')
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
