<?php

declare(strict_types=1);

namespace App\Support\Storefront;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The single definition of "what a customer can actually buy".
 *
 * A product is only sellable when it is active AND has at least one active
 * supplier mapping — `CheckoutAction` aborts on a product with no active
 * supplier, so listing one would advertise an order that can only fail at
 * submit time. Every storefront query goes through here so the catalog and
 * checkout can never disagree about what is on sale.
 */
final class Catalog
{
    /**
     * Constrain a Product query to rows checkout would accept.
     *
     * Accepts a Builder or a HasMany relation — `$game->products()` returns the
     * latter, and both forward `where`/`whereHas` to the same underlying query.
     *
     * @template T of Builder|HasMany
     *
     * @param  T  $query
     * @return T
     */
    public static function sellableProducts(Builder|HasMany $query): Builder|HasMany
    {
        return $query
            ->where('status', true)
            ->whereHas('supplierProducts', fn (Builder $q) => $q->where('is_active', true));
    }

    /** Games (categories) that are active and have at least one sellable product. */
    public static function sellableGames(): Builder
    {
        return Category::query()
            ->where('status', true)
            ->whereHas('products', fn (Builder $q) => self::sellableProducts($q));
    }

    /** Sellable products belonging to one game. */
    public static function productsFor(Category $game): HasMany
    {
        return self::sellableProducts($game->products());
    }

    /**
     * Resolve the `{game}` route segment.
     *
     * Accepts slug, code or numeric id: `slug` is nullable on older rows, and
     * the admin panel links games by `code`, so keying on slug alone would
     * 404 half the catalog.
     */
    public static function resolveGame(string $key): ?Category
    {
        return Category::query()
            ->where('status', true)
            ->where(function (Builder $q) use ($key) {
                $q->where('slug', $key)->orWhere('code', $key);

                if (ctype_digit($key)) {
                    $q->orWhere('id', (int) $key);
                }
            })
            ->first();
    }

    /** Two-letter fallback tile shown when a game has no artwork. */
    public static function initials(string $name): string
    {
        return collect(preg_split('/\s+/', trim($name)) ?: [])
            ->filter()
            ->take(2)
            ->map(fn (string $word) => mb_strtoupper(mb_substr($word, 0, 1)))
            ->implode('');
    }

    /** Digits leading a denomination name ("100 Diamonds" → 100), else null. */
    public static function amountFromName(string $name): ?int
    {
        return preg_match('/\d[\d.,]*/', $name, $m) === 1
            ? (int) preg_replace('/\D/', '', $m[0])
            : null;
    }

    /** @return array{id: int, name: string, code: string, price: int, group: string, sub_category_id: int|null, amount: int|null} */
    public static function denomination(Product $product, int $price): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'code' => $product->code,
            'price' => $price,
            'group' => $product->subCategory?->name ?? 'Lainnya',
            'sub_category_id' => $product->sub_category_id,
            'amount' => self::amountFromName($product->name),
        ];
    }
}
