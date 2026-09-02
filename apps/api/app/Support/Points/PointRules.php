<?php

declare(strict_types=1);

namespace App\Support\Points;

use App\Models\Product;
use App\Models\Setting;

/**
 * How many points a purchase earns, and what a point is worth when spent.
 *
 * Per product, with a global fallback: a product left unconfigured still earns,
 * so a new SKU is not silently worthless to the customer. Percent and flat are
 * additive — the percent scales with the sale, the flat is the promotional
 * sweetener a cheap denomination needs to be worth anything at all.
 */
final class PointRules
{
    /** Settings group and keys, so the admin surface and this agree. */
    public const GROUP = 'points';

    public const KEY_PERCENT = 'earn_percent';

    public const KEY_FLAT = 'earn_flat';

    public const KEY_RATE = 'redeem_rate';

    /**
     * Points earned on a base amount.
     *
     * `ceil` on the percent, matching how prices round: rounding a customer's
     * reward down would be the one place this codebase rounds against them.
     */
    public static function earnedFor(?Product $product, int $baseAmount): int
    {
        if ($baseAmount <= 0) {
            return 0;
        }

        $percent = $product?->point_percent !== null
            ? (float) $product->point_percent
            : self::setting(self::KEY_PERCENT, 0.0);

        $flat = $product?->point_flat !== null
            ? (int) $product->point_flat
            : (int) self::setting(self::KEY_FLAT, 0.0);

        $earned = (int) ceil($baseAmount * $percent / 100) + $flat;

        return max($earned, 0);
    }

    /** Rupiah value of one point when redeemed. Defaults to 1:1. */
    public static function redeemRate(): int
    {
        $rate = (int) self::setting(self::KEY_RATE, 1.0);

        return $rate > 0 ? $rate : 1;
    }

    /** The rupiah a number of points is worth. */
    public static function rupiahFor(int $points): int
    {
        return max($points, 0) * self::redeemRate();
    }

    /**
     * The points needed to cover a rupiah amount, never more than the customer
     * holds. Rounded **down**, so redeeming can never overshoot the price.
     */
    public static function pointsToCover(int $rupiah): int
    {
        return intdiv(max($rupiah, 0), self::redeemRate());
    }

    private static function setting(string $key, float $default): float
    {
        $value = Setting::query()
            ->where('group', self::GROUP)
            ->where('key', $key)
            ->first()?->typedValue();

        return is_numeric($value) ? (float) $value : $default;
    }
}
