<?php

namespace App\Actions\Uxiotopup;

use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Services\UxiotopupService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Str;

/**
 * List the uxiotopup price list for the admin Product Provider tab.
 *
 * Reads the shared 5-minute price-list cache (kept warm by the scheduled
 * uxiotopup:check-prices job), so browsing/paging/searching this screen never
 * issues a fresh upstream call. Each raw item is normalised to the documented
 * /service fields, flagged with whether it is already mapped to one of our
 * products, then filtered and paginated in-memory.
 */
class ListUxiotopupPriceListAction
{
    public function __construct(
        private readonly UxiotopupService $uxiotopupService
    ) {}

    public function execute(?string $search, bool $onlyUnmapped, int $perPage, int $page): LengthAwarePaginator
    {
        // May throw when uxiotopup is down and the cache is cold — the controller
        // translates that into a 502.
        $items = $this->uxiotopupService->getPriceListCached();

        // One query for the whole page: service ids already mapped to a product.
        $uxiotopupId = Supplier::where('name', 'Uxiotopup')->value('id');
        $mapped = $uxiotopupId
            ? SupplierProduct::where('supplier_id', $uxiotopupId)->pluck('buyer_sku_code')->flip()
            : collect();

        $rows = collect($items)
            // Defense-in-depth: the service already rejects a non-list payload,
            // but never let a stray non-array row reach the array-typed closure.
            ->filter(fn ($item) => is_array($item))
            ->map(fn (array $item) => $this->normalise($item, isset($mapped[$item['id'] ?? ''])))
            ->when($search !== null && $search !== '', fn ($rows) => $rows->filter(
                fn (array $row) => $this->matchesSearch($row, $search)
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

    /**
     * @param  array<string,mixed>  $item
     * @return array<string,mixed>
     */
    private function normalise(array $item, bool $alreadyMapped): array
    {
        return [
            // buyer_sku_code carries the uxiotopup service id end-to-end.
            'buyer_sku_code' => (string) ($item['id'] ?? ''),
            'name' => (string) ($item['nama_layanan'] ?? ''),
            'category' => (string) ($item['kategori'] ?? ''),
            'cost' => $this->uxiotopupService->costFor($item),
            'harga' => (int) ($item['harga'] ?? 0),
            'harga_gold' => (int) ($item['harga_gold'] ?? 0),
            'harga_silver' => (int) ($item['harga_silver'] ?? 0),
            'harga_pro' => (int) ($item['harga_pro'] ?? 0),
            'available' => UxiotopupService::isItemActive($item),
            'already_mapped' => $alreadyMapped,
        ];
    }

    /**
     * @param  array<string,mixed>  $row
     */
    private function matchesSearch(array $row, string $search): bool
    {
        $needle = Str::lower($search);

        foreach (['name', 'buyer_sku_code', 'category'] as $field) {
            if (Str::contains(Str::lower((string) $row[$field]), $needle)) {
                return true;
            }
        }

        return false;
    }
}
