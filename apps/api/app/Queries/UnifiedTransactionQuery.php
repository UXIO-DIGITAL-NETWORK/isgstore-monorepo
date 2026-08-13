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

    public function __construct(
        /** null = every client (the internal view). */
        private readonly ?int $merchantId = null,
        /** Adds the fee/profit columns. Omitted entirely from the SQL otherwise,
         *  so even a careless raw return cannot leak them to a merchant. */
        private readonly bool $withPlatformFigures = false,
    ) {}

    public function build(string $type, ?string $status = null, ?string $search = null): Builder
    {
        $base = match ($type) {
            self::TYPE_SALE => $this->salesLeg($status, $search),
            self::TYPE_SERVICE => $this->serviceLeg($status, $search),
            // Union only for "Semua". A single-type tab hits one table directly,
            // so the (merchant_id, created_at) index can actually be used.
            default => $this->salesLeg($status, $search)
                ->unionAll($this->serviceLeg($status, $search)),
        };

        return DB::query()
            ->fromSub($base, 'tx')
            ->orderByDesc('occurred_at')
            // Deterministic tiebreak: two rows written in the same second must
            // not swap places between page 1 and page 2.
            ->orderByDesc('source')
            ->orderByDesc('source_id');
    }

    /**
     * Both legs must emit the SAME column names in the SAME order. A mismatch
     * does not error on MySQL — it silently transposes values — so the two
     * select lists are built here, next to each other, and never edited apart.
     */
    private function salesLeg(?string $status, ?string $search): Builder
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

        if ($status) {
            $query->where('t.status', $status);
        }

        if ($search) {
            $query->where('t.invoice_number', 'like', $this->like($search));
        }

        return $query;
    }

    private function serviceLeg(?string $status, ?string $search): Builder
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

        if ($status) {
            $query->where('si.status', $status);
        }

        if ($search) {
            $query->where('si.invoice_number', 'like', $this->like($search));
        }

        return $query;
    }

    private function like(string $term): string
    {
        return '%'.str_replace('%', '\%', $term).'%';
    }
}
