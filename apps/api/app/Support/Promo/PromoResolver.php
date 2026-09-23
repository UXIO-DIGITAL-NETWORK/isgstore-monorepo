<?php

declare(strict_types=1);

namespace App\Support\Promo;

use App\Models\Product;
use App\Models\Promo;
use App\Models\User;
use App\Support\Money;

/**
 * The single definition of what a promo code is worth.
 *
 * Both the storefront's validate endpoint and checkout resolve through this
 * class. If they each computed their own discount the two could drift, and the
 * customer would be quoted one number and charged another — which is the worst
 * possible way for this to be wrong.
 */
final class PromoResolver
{
    public function __construct(
        public readonly bool $valid,
        public readonly int $discount,
        public readonly string $message,
        public readonly ?Promo $promo = null,
    ) {}

    /**
     * @param  int  $amount  The pre-discount price the promo applies to.
     * @param  Product|null  $product  What is being bought, so a scoped code can
     *                                 be checked against it. Null means "not
     *                                 known", which a scoped promo is refused on.
     */
    public static function resolve(?string $code, int $amount, ?User $user = null, ?Product $product = null): self
    {
        $code = trim((string) $code);

        if ($code === '') {
            return new self(false, 0, 'Kode promo kosong.');
        }

        $promo = Promo::running()->whereRaw('UPPER(code) = ?', [strtoupper($code)])->first();

        if (! $promo) {
            return new self(false, 0, 'Kode promo tidak ditemukan atau sudah tidak berlaku.');
        }

        if (! self::appliesTo($promo, $product)) {
            return new self(false, 0, 'Kode promo ini tidak berlaku untuk produk ini.', $promo);
        }

        if ($amount < (int) $promo->min_purchase) {
            return new self(
                false,
                0,
                'Minimum pembelian '.Money::rupiah((int) $promo->min_purchase).' untuk kode ini.',
                $promo,
            );
        }

        if ($promo->quota_total !== null && (int) $promo->used_count >= (int) $promo->quota_total) {
            return new self(false, 0, 'Kuota kode promo ini sudah habis.', $promo);
        }

        // Per-user limits are meaningless for a guest — there is no identity to
        // count against, so the limit simply does not apply.
        if ($promo->quota_per_user !== null && $user) {
            $used = $promo->redemptions()->where('user_id', $user->id)->count();

            if ($used >= (int) $promo->quota_per_user) {
                return new self(false, 0, 'Kamu sudah menggunakan kode promo ini.', $promo);
            }
        }

        return new self(true, self::discountFor($promo, $amount), 'Kode promo berhasil diterapkan.', $promo);
    }

    /**
     * Whether the promo's own scope covers what is being bought.
     *
     * `scope` and `scope_id` have been validated and persisted since the table
     * was created, but nothing read them — so a code an operator scoped to one
     * product or one category behaved as global and could be redeemed on any SKU,
     * with the discount coming out of margin.
     */
    private static function appliesTo(Promo $promo, ?Product $product): bool
    {
        $scope = (string) ($promo->scope ?? 'global');
        $scopeId = $promo->scope_id !== null ? (int) $promo->scope_id : null;

        // A scoped promo with no id names nothing, so there is no scoping to
        // enforce; reading it as global is what it did before this check existed.
        if ($scope === 'global' || $scopeId === null) {
            return true;
        }

        // Asked to judge without knowing the product. A wrong "yes" here hands
        // out a discount nobody intended, so the answer is no.
        if ($product === null) {
            return false;
        }

        return match ($scope) {
            'product' => $scopeId === (int) $product->getKey(),
            'category' => $scopeId === (int) $product->category_id,
            default => true,
        };
    }

    /**
     * Percentage discounts are capped by `max_discount`; a fixed discount can
     * never exceed the amount itself, so a Rp 50.000 code on a Rp 20.000 order
     * takes the order to zero rather than going negative.
     */
    private static function discountFor(Promo $promo, int $amount): int
    {
        if ($promo->type === 'fixed') {
            return min((int) $promo->value, $amount);
        }

        $discount = (int) round($amount * ((int) $promo->value / 100));

        if ($promo->max_discount !== null) {
            $discount = min($discount, (int) $promo->max_discount);
        }

        return min($discount, $amount);
    }
}
