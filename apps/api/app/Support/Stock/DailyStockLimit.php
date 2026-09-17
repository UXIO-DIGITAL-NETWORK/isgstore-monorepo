<?php

declare(strict_types=1);

namespace App\Support\Stock;

use App\Enums\TransactionStatus;
use App\Models\Product;
use App\Models\SupplierProduct;
use App\Models\Transaction;
use App\Support\DateTime\Wib;
use Illuminate\Support\Carbon;

/**
 * The per-SKU daily selling allowance: how many orders a denomination may take
 * today, and how many it has taken.
 *
 * **This is a local quota, not the provider's stock.** uxiolabs reports a single
 * `aktif`/`nonaktif` flag per service and no quantity anywhere, and it exposes no
 * pre-order availability check — so there is no number to mirror. What this
 * encodes is the operator's own decision: "we will sell at most N of this today".
 *
 * "Used today" is COUNTED from `transactions`, never kept as a decremented
 * counter. A counter would need a release path in every place an order can go
 * terminal — the expiry sweeps, the refund path, the job's `failed()` — and one
 * missed path leaks a slot forever. Counting cannot drift: an order that failed,
 * was refunded or expired simply stops counting. The price is one indexed COUNT
 * per checkout, which is a fair trade for never handing out a slot twice.
 *
 * The day is the platform's one wall clock (WIB), so the allowance resets at
 * midnight Jakarta time wherever the server happens to sit.
 */
final class DailyStockLimit
{
    /** What the customer is told when the day's allowance is gone. */
    public const EXHAUSTED_MESSAGE = 'Kuota harian produk ini sudah habis. Coba lagi besok.';

    /** The mapping's ceiling, or null for unlimited (which is every row until an admin sets one). */
    public static function forMapping(?SupplierProduct $mapping): ?int
    {
        $limit = $mapping?->daily_order_limit;

        return $limit === null ? null : (int) $limit;
    }

    /**
     * Orders that still hold a slot today.
     *
     * Everything except the three terminal non-sales: an order the provider
     * could not fill, one that was refunded, and one that was never paid.
     */
    public static function usedToday(int $productId): int
    {
        return Transaction::query()
            ->where('product_id', $productId)
            ->whereIn('status', self::holdingStatuses())
            ->where('created_at', '>=', self::todayStart())
            ->count();
    }

    /**
     * The same count for a whole catalogue page, in one query.
     *
     * Rendering a game's denominations maps every row through this; a count per
     * row would be an N+1 on the busiest storefront query there is.
     *
     * @param  array<int,int>  $productIds
     * @return array<int,int> product_id ⇒ orders holding a slot today (absent = none)
     */
    public static function usedTodayFor(array $productIds): array
    {
        if ($productIds === []) {
            return [];
        }

        return Transaction::query()
            ->whereIn('product_id', $productIds)
            ->whereIn('status', self::holdingStatuses())
            ->where('created_at', '>=', self::todayStart())
            ->groupBy('product_id')
            ->selectRaw('product_id, COUNT(*) as used')
            ->pluck('used', 'product_id')
            ->map(fn ($used) => (int) $used)
            ->all();
    }

    /** Slots left today, or null when the mapping has no ceiling. Never negative. */
    public static function remaining(Product $product, ?SupplierProduct $mapping): ?int
    {
        $limit = self::forMapping($mapping);

        if ($limit === null) {
            return null;
        }

        return max(0, $limit - self::usedToday((int) $product->getKey()));
    }

    /**
     * Slots left today for a whole page of products, keyed by product id.
     *
     * The products must be loaded with their `supplierProducts` relation (the
     * active mapping carries the ceiling) — the callers already eager-load it for
     * the catalogue, and a lazy load here would be one query per row.
     *
     * @param  iterable<Product>  $products
     * @return array<int,int|null> product id ⇒ slots left (null = no ceiling)
     */
    public static function remainingFor(iterable $products): array
    {
        $products = collect($products);

        $used = self::usedTodayFor(
            $products->map(fn (Product $product) => (int) $product->getKey())->all()
        );

        return $products->mapWithKeys(function (Product $product) use ($used) {
            $id = (int) $product->getKey();
            $limit = self::forMapping($product->supplierProducts->first());

            return [$id => $limit === null ? null : max(0, $limit - ($used[$id] ?? 0))];
        })->all();
    }

    /** Whether a `remaining()` value means "not today". Null (no ceiling) is never sold out. */
    public static function isSoldOut(?int $remaining): bool
    {
        return $remaining !== null && $remaining <= 0;
    }

    /** Whether today's allowance is spent. False for an unlimited mapping. */
    public static function isExhausted(Product $product, ?SupplierProduct $mapping): bool
    {
        $remaining = self::remaining($product, $mapping);

        return $remaining !== null && $remaining <= 0;
    }

    /** Midnight WIB, as the UTC instant the rows are actually stored in. */
    public static function todayStart(): Carbon
    {
        return Carbon::now(Wib::TZ)->startOfDay()->utc();
    }

    /** @return array<int,string> */
    private static function holdingStatuses(): array
    {
        $released = [
            TransactionStatus::FAILED_PROVIDER->value,
            TransactionStatus::REFUNDED->value,
            TransactionStatus::EXPIRED->value,
        ];

        return array_values(array_diff(
            array_map(fn (TransactionStatus $status) => $status->value, TransactionStatus::cases()),
            $released,
        ));
    }
}
