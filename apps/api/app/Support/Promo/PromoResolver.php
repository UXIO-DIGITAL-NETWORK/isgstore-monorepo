<?php

declare(strict_types=1);

namespace App\Support\Promo;

use App\Models\Promo;
use App\Models\User;

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
     */
    public static function resolve(?string $code, int $amount, ?User $user = null): self
    {
        $code = trim((string) $code);

        if ($code === '') {
            return new self(false, 0, 'Kode promo kosong.');
        }

        $promo = Promo::running()->whereRaw('UPPER(code) = ?', [strtoupper($code)])->first();

        if (! $promo) {
            return new self(false, 0, 'Kode promo tidak ditemukan atau sudah tidak berlaku.');
        }

        if ($amount < (int) $promo->min_purchase) {
            return new self(
                false,
                0,
                'Minimum pembelian Rp '.number_format((int) $promo->min_purchase, 0, ',', '.').' untuk kode ini.',
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
