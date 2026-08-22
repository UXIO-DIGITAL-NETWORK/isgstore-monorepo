<?php

namespace App\Actions\Digiflazz;

use App\Actions\Storefront\ValidateGameIdAction;
use App\Services\DigiflazzService;
use Illuminate\Support\Str;

/**
 * List the Digiflazz "cek username" / account-inquiry SKUs for the admin.
 *
 * These SKUs return a player's in-game name in the transaction `sn` and are what
 * `categories.validasi_nickname` stores as `digiflazz:{sku}` (consumed by
 * {@see ValidateGameIdAction}). Surfacing them as a
 * pickable list lets an operator turn Cek Username on for a game from the admin
 * panel instead of pasting a raw SKU string.
 *
 * Reads the shared 5-minute price-list cache (kept warm by digiflazz:check-prices),
 * so this never issues a fresh upstream call. Cek-username SKUs live in the PREPAID
 * list (the seeded `mlus` / `ffusername` are prepaid).
 *
 * Digiflazz does not tag these rows with a machine-readable flag, so they are
 * matched by name: any of `buyer_sku_code` / `product_name` / `desc` containing a
 * known needle. Keep {@see self::CEK_USERNAME_NEEDLES} as the single tuning point —
 * confirm it against the live price list (grep for `mlus` / `ffusername`) and adjust
 * if a row is missed or a non-inquiry SKU leaks in.
 */
class ListCekUsernameSkusAction
{
    /** Lower-cased substrings that mark a price-list row as a cek-username SKU. */
    private const CEK_USERNAME_NEEDLES = ['username', 'inquiry', 'nickname', 'cek id', 'cek-id', 'cek user'];

    public function __construct(
        private readonly DigiflazzService $digiflazzService
    ) {}

    /**
     * @return array<int,array{sku:string,label:string}>
     */
    public function execute(): array
    {
        // May throw when Digiflazz is down and the cache is cold — the controller
        // translates that into a 502.
        $items = $this->digiflazzService->getPriceListCached('prepaid');

        return collect($items)
            // Defense-in-depth: the service already rejects a non-list payload,
            // but never let a stray non-array row reach the array-typed closure.
            ->filter(fn ($item) => is_array($item))
            ->filter(fn (array $item) => $this->isCekUsername($item))
            ->map(fn (array $item) => [
                'sku' => (string) ($item['buyer_sku_code'] ?? ''),
                'label' => $this->label($item),
            ])
            ->filter(fn (array $row) => $row['sku'] !== '')
            ->unique('sku')
            ->sortBy('label', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
    }

    /**
     * @param  array<string,mixed>  $item
     */
    private function isCekUsername(array $item): bool
    {
        $haystack = Str::lower(
            ((string) ($item['buyer_sku_code'] ?? '')).' '.
            ((string) ($item['product_name'] ?? '')).' '.
            ((string) ($item['desc'] ?? ''))
        );

        foreach (self::CEK_USERNAME_NEEDLES as $needle) {
            if (Str::contains($haystack, $needle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string,mixed>  $item
     */
    private function label(array $item): string
    {
        $name = trim((string) ($item['product_name'] ?? ''));
        $brand = trim((string) ($item['brand'] ?? ''));

        if ($name !== '' && $brand !== '') {
            return "{$brand} — {$name}";
        }

        return $name !== '' ? $name : $brand;
    }
}
