<?php

declare(strict_types=1);

namespace App\Support\Pricing;

use App\Models\FlashSale;
use App\Models\FlashSaleItem;
use Illuminate\Support\Facades\Cache;

/**
 * The price a running flash sale puts on a product, or null when it is not on
 * sale.
 *
 * This exists because the two halves disagreed: `GET /v1/storefront/flash-sale`
 * advertised a `sale_price` that no pricing path ever read, so the homepage
 * showed the customer one number and checkout charged them another. `PlanPrice`
 * now consults this, and `PlanPrice` is shared by the catalogue and checkout —
 * which is what makes the advertised price the charged one, everywhere at once.
 *
 * Memoised per request and cached for a minute: rendering a catalogue maps every
 * row through `PlanPrice`, so a query per product would turn one listing into N,
 * and a sale window is minute-granularity in any case.
 */
final class FlashSalePrice
{
    private const CACHE_KEY = 'flash-sale:prices';

    private const CACHE_TTL_SECONDS = 60;

    /** @var array<int,int>|null */
    private static ?array $prices = null;

    public static function forProduct(int $productId): ?int
    {
        return self::prices()[$productId] ?? null;
    }

    /** @return array<int,int> product_id ⇒ sale_price */
    private static function prices(): array
    {
        return self::$prices ??= Cache::remember(
            self::CACHE_KEY,
            self::CACHE_TTL_SECONDS,
            fn () => self::load(),
        );
    }

    /** @return array<int,int> */
    private static function load(): array
    {
        return FlashSale::running()
            ->with('items')
            ->get()
            ->flatMap(fn (FlashSale $sale) => $sale->items)
            // Deliberately not filtered on stock: the public flash-sale endpoint
            // does not filter either, so a line it advertises at a sale price is
            // a line priced at that price. Enforcing stock belongs in both places
            // together, with one agreed meaning for `stock_total = 0`.
            ->mapWithKeys(fn (FlashSaleItem $item) => [(int) $item->product_id => (int) $item->sale_price])
            ->all();
    }
}
