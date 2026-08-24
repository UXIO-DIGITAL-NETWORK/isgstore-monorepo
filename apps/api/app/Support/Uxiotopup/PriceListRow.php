<?php

declare(strict_types=1);

namespace App\Support\Uxiotopup;

use App\Services\UxiotopupService;
use Illuminate\Support\Str;

/**
 * Normalises one raw uxiotopup /service item into the shape the admin screens read.
 *
 * The upstream payload is a bare array with no schema — `id`, `nama_layanan`,
 * `kategori`, the four `harga*` tiers and `status`. Two screens consume it (the
 * legacy price-list browser and the pool-candidate panel) and they must not drift,
 * so the field mapping and the search predicate live here rather than in either.
 */
final class PriceListRow
{
    /**
     * @param  array<string,mixed>  $item
     * @return array<string,mixed>
     */
    public static function normalise(array $item, UxiotopupService $service, bool $alreadyMapped): array
    {
        return [
            // buyer_sku_code carries the uxiotopup service id end-to-end.
            'buyer_sku_code' => (string) ($item['id'] ?? ''),
            'name' => (string) ($item['nama_layanan'] ?? ''),
            'category' => (string) ($item['kategori'] ?? ''),
            'cost' => $service->costFor($item),
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
    public static function matchesSearch(array $row, string $search): bool
    {
        $needle = Str::lower($search);

        foreach (['name', 'buyer_sku_code', 'category'] as $field) {
            if (Str::contains(Str::lower((string) ($row[$field] ?? '')), $needle)) {
                return true;
            }
        }

        return false;
    }
}
