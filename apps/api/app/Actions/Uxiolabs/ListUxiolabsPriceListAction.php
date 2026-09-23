<?php

namespace App\Actions\Uxiolabs;

use App\Contracts\SupplierGateway;
use App\Models\SupplierProduct;
use App\Support\Uxiolabs\PriceListRow;
use App\Support\Uxiolabs\UxiolabsSupplier;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;

/**
 * List the uxiolabs price list for the admin Product Provider tab.
 *
 * Reads the shared 5-minute price-list cache (kept warm by the scheduled
 * uxiolabs:check-prices job), so browsing/paging/searching this screen never
 * issues a fresh upstream call. Each raw item is normalised to the documented
 * /service fields, flagged with whether it is already mapped to one of our
 * products, then filtered and paginated in-memory.
 */
class ListUxiolabsPriceListAction
{
    public function __construct(
        private readonly SupplierGateway $uxiolabsService
    ) {}

    public function execute(?string $search, bool $onlyUnmapped, int $perPage, int $page): LengthAwarePaginator
    {
        // May throw when uxiolabs is down and the cache is cold — the controller
        // translates that into a 502.
        $items = $this->uxiolabsService->getPriceListCached();

        // One query for the whole page: service ids already mapped to a product.
        $uxiolabsId = UxiolabsSupplier::id();
        $mapped = $uxiolabsId
            ? SupplierProduct::where('supplier_id', $uxiolabsId)->pluck('buyer_sku_code')->flip()
            : collect();

        $rows = collect($items)
            // Defense-in-depth: the service already rejects a non-list payload,
            // but never let a stray non-array row reach the array-typed closure.
            ->filter(fn ($item) => is_array($item))
            ->map(fn (array $item) => PriceListRow::normalise($item, $this->uxiolabsService, isset($mapped[$item['id'] ?? ''])))
            ->when($search !== null && $search !== '', fn ($rows) => $rows->filter(
                fn (array $row) => PriceListRow::matchesSearch($row, $search)
            ))
            ->when($onlyUnmapped, fn ($rows) => $rows->reject(fn (array $row) => $row['already_mapped']))
            ->values();

        $total = $rows->count();
        $slice = $rows->slice(($page - 1) * $perPage, $perPage)->values()->all();

        return new LengthAwarePaginator($slice, $total, $perPage, $page, [
            'path' => Paginator::resolveCurrentPath(),
            'query' => request()->query(),
        ]);
    }
}
