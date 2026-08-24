<?php

declare(strict_types=1);

namespace App\Actions\Uxiotopup;

use App\Models\SupplierCategory;
use App\Services\UxiotopupService;
use App\Support\Uxiotopup\UxiotopupSupplier;

/**
 * The distinct `kategori` values the uxiotopup price list currently carries.
 *
 * This backs the Category Provider dropdown. The provider has no category codes —
 * `kategori` is free text — so an admin who types it by hand will silently map a
 * category that matches nothing. Offering only values that exist upstream right
 * now makes that failure impossible instead of invisible.
 */
class ListUxiotopupCategoriesAction
{
    public function __construct(
        private readonly UxiotopupService $uxiotopupService
    ) {}

    /**
     * @return array<int,array<string,mixed>>
     */
    public function execute(bool $onlyUnmapped = false): array
    {
        // May throw when uxiotopup is down and the cache is cold — the controller
        // translates that into a 502.
        $items = $this->uxiotopupService->getPriceListCached();

        $supplierId = UxiotopupSupplier::id();

        /** @var array<string,SupplierCategory> $mapped */
        $mapped = $supplierId
            ? SupplierCategory::with('category')
                ->where('supplier_id', $supplierId)
                ->get()
                ->keyBy('provider_category')
                ->all()
            : [];

        $groups = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $kategori = trim((string) ($item['kategori'] ?? ''));

            if ($kategori === '') {
                continue;
            }

            $groups[$kategori] ??= ['sku_count' => 0, 'available_count' => 0];
            $groups[$kategori]['sku_count']++;

            if (UxiotopupService::isItemActive($item)) {
                $groups[$kategori]['available_count']++;
            }
        }

        ksort($groups, SORT_NATURAL | SORT_FLAG_CASE);

        $rows = [];

        foreach ($groups as $value => $counts) {
            $link = $mapped[$value] ?? null;

            if ($onlyUnmapped && $link !== null) {
                continue;
            }

            $rows[] = [
                'value' => $value,
                'sku_count' => $counts['sku_count'],
                'available_count' => $counts['available_count'],
                'mapped_category_id' => $link?->category_id,
                'mapped_category_name' => $link?->category?->name,
            ];
        }

        return $rows;
    }
}
