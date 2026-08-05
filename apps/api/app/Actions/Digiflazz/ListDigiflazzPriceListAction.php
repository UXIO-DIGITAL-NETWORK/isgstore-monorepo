<?php

namespace App\Actions\Digiflazz;

use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Services\DigiflazzService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Str;

/**
 * List the Digiflazz price list for the admin Product Provider tab.
 *
 * Reads the shared 5-minute price-list cache (kept warm by the scheduled
 * digiflazz:check-prices job), so browsing/paging/searching this screen never
 * issues a fresh upstream call — honouring Digiflazz's "gunakan secara bijak,
 * simpan di database Anda" rate-limit guidance. Each raw item is normalised to
 * the documented price-list fields, flagged with whether it is already mapped to
 * one of our products, then filtered and paginated in-memory.
 */
class ListDigiflazzPriceListAction
{
    public function __construct(
        private readonly DigiflazzService $digiflazzService
    ) {}

    public function execute(string $type, ?string $search, bool $onlyUnmapped, int $perPage, int $page): LengthAwarePaginator
    {
        // May throw when Digiflazz is down and the cache is cold — the controller
        // translates that into a 502.
        $items = $this->digiflazzService->getPriceListCached($type);

        // One query for the whole page: SKUs already mapped to a Digiflazz product.
        $digiflazzId = Supplier::where('name', 'Digiflazz')->value('id');
        $mapped = $digiflazzId
            ? SupplierProduct::where('supplier_id', $digiflazzId)->pluck('buyer_sku_code')->flip()
            : collect();

        $rows = collect($items)
            // Defense-in-depth: the service already rejects a non-list payload,
            // but never let a stray non-array row reach the array-typed closure.
            ->filter(fn ($item) => is_array($item))
            ->map(fn (array $item) => $this->normalise($item, $type, isset($mapped[$item['buyer_sku_code'] ?? ''])))
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
    private function normalise(array $item, string $type, bool $alreadyMapped): array
    {
        $buyerStatus = (bool) ($item['buyer_product_status'] ?? false);
        $sellerStatus = (bool) ($item['seller_product_status'] ?? false);

        // Fields common to prepaid and pasca.
        $row = [
            'buyer_sku_code' => (string) ($item['buyer_sku_code'] ?? ''),
            'name' => (string) ($item['product_name'] ?? ''),
            'brand' => (string) ($item['brand'] ?? ''),
            'category' => (string) ($item['category'] ?? ''),
            'seller_name' => (string) ($item['seller_name'] ?? ''),
            'desc' => (string) ($item['desc'] ?? ''),
            'type' => $type,
            'cost' => (int) ($type === 'pasca' ? ($item['admin'] ?? 0) : ($item['price'] ?? 0)),
            'buyer_product_status' => $buyerStatus,
            'seller_product_status' => $sellerStatus,
            'available' => $buyerStatus && $sellerStatus,
            'already_mapped' => $alreadyMapped,
        ];

        if ($type === 'pasca') {
            // Pascabayar carries admin fee + buyer commission, no stock/cut-off.
            $row['admin_fee'] = (int) ($item['admin'] ?? 0);
            $row['commission'] = (int) ($item['commission'] ?? 0);

            return $row;
        }

        // Prepaid extras straight from the documented response.
        $row['product_type'] = (string) ($item['type'] ?? '');
        $row['price'] = (int) ($item['price'] ?? 0);
        $row['unlimited_stock'] = (bool) ($item['unlimited_stock'] ?? false);
        $row['stock'] = (int) ($item['stock'] ?? 0);
        $row['multi'] = (bool) ($item['multi'] ?? false);
        $row['start_cut_off'] = (string) ($item['start_cut_off'] ?? '');
        $row['end_cut_off'] = (string) ($item['end_cut_off'] ?? '');

        return $row;
    }

    /**
     * @param  array<string,mixed>  $row
     */
    private function matchesSearch(array $row, string $search): bool
    {
        $needle = Str::lower($search);

        foreach (['name', 'buyer_sku_code', 'brand', 'category'] as $field) {
            if (Str::contains(Str::lower((string) $row[$field]), $needle)) {
                return true;
            }
        }

        return false;
    }
}
