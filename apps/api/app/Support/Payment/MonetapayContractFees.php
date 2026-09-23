<?php

declare(strict_types=1);

namespace App\Support\Payment;

/**
 * Monetapay's contract fee schedule — the single source of truth for the gateway
 * cut kita pays per transaction.
 *
 * Under the signed PT Moneta Pembayaran Teknologi agreement the billing model is
 * "Direct Deduction": Monetapay deducts a FIXED, published fee from kita's balance
 * on every collection/disbursement. Because the schedule is deterministic, the
 * `payments.gateway_fee` frozen at checkout (CheckoutAction) equals what Monetapay
 * actually deducts — as long as the per-channel config mirrors this table. This
 * class makes that contract explicit so config drift can be audited/alerted
 * (see ReconcileGatewayFeesAction, ChannelFeeController) instead of silently
 * eroding profit.
 *
 * A channel carries a flat fee (VA/retail/disbursement) OR a percent (QRIS/
 * e-wallet), never both. `settlement_days` is the T+n funds-availability delay —
 * captured here as contract reference only; it is NOT yet used in any balance
 * logic (deferred phase).
 *
 * This table is also the gate the Hub sync reads before letting a Hub-created
 * channel go live (`gatedActive`), so a code absent here can neither be turned on
 * nor re-created. BCA VA is absent for that reason: this site's gateway does not
 * offer it.
 */
final class MonetapayContractFees
{
    /**
     * channel_code => [flat (Rp), percent (%), settlement_days (T+n)|null]
     *
     * @var array<string, array{flat:int, percent:float, settlement_days:int|null}>
     */
    public const CONTRACT = [
        // Internal — no gateway involved.
        'balance' => ['flat' => 0, 'percent' => 0.0, 'settlement_days' => null],
        'payment_link' => ['flat' => 0, 'percent' => 0.0, 'settlement_days' => null],

        // Virtual Account — flat, T+0. (Mandiri is the odd one out at Rp 1.900.)
        'bri_va' => ['flat' => 1500, 'percent' => 0.0, 'settlement_days' => 0],
        'bni_va' => ['flat' => 1500, 'percent' => 0.0, 'settlement_days' => 0],
        'mandiri_va' => ['flat' => 1900, 'percent' => 0.0, 'settlement_days' => 0],
        'permata_va' => ['flat' => 1500, 'percent' => 0.0, 'settlement_days' => 0],
        'cimb_va' => ['flat' => 1500, 'percent' => 0.0, 'settlement_days' => 0],
        'bss_va' => ['flat' => 1500, 'percent' => 0.0, 'settlement_days' => 0],
        'danamon_va' => ['flat' => 1500, 'percent' => 0.0, 'settlement_days' => 0],

        // Modern retail — flat, T+3.
        'indomaret' => ['flat' => 4300, 'percent' => 0.0, 'settlement_days' => 3],
        'alfamart' => ['flat' => 4300, 'percent' => 0.0, 'settlement_days' => 3],

        // QRIS / e-money — percent. GoPay is billed at the QRIS rate.
        'qris' => ['flat' => 0, 'percent' => 0.7, 'settlement_days' => 1],
        'gopay' => ['flat' => 0, 'percent' => 0.7, 'settlement_days' => 1],
        'dana' => ['flat' => 0, 'percent' => 1.6, 'settlement_days' => 1],
        'ovo' => ['flat' => 0, 'percent' => 1.8, 'settlement_days' => 2],
        'linkaja' => ['flat' => 0, 'percent' => 1.8, 'settlement_days' => 2],
        'shopeepay' => ['flat' => 0, 'percent' => 2.1, 'settlement_days' => 2],
    ];

    /** Disbursement (payout) is not a payment_channel row; its fee is flat, T+1. */
    public const DISBURSEMENT_FEE = 1500;

    public const DISBURSEMENT_SETTLEMENT_DAYS = 1;

    /**
     * Whether the channel is listed here at all. This is the gate the Hub sync
     * uses before it will let a Hub-created channel go live: a code we hold no
     * rate for is also a code MerchantBalance settles at T+0, which would make
     * money withdrawable before Monetapay has released it.
     */
    public static function has(string $channelCode): bool
    {
        return isset(self::CONTRACT[$channelCode]);
    }

    public static function flatFor(string $channelCode): ?int
    {
        return self::CONTRACT[$channelCode]['flat'] ?? null;
    }

    public static function percentFor(string $channelCode): ?float
    {
        return self::CONTRACT[$channelCode]['percent'] ?? null;
    }

    public static function settlementDays(string $channelCode): ?int
    {
        return self::CONTRACT[$channelCode]['settlement_days'] ?? null;
    }

    /**
     * The gateway fee Monetapay is contracted to deduct for a payment of
     * `$grossAmount` through this channel. Uses the SAME formula the checkout
     * freezes with (CheckoutAction: flat + round(gross * percent/100)) so an
     * audit compares like with like. Null when the channel is not in the
     * contract (caller must decide how to treat an unlisted channel).
     */
    public static function expectedGatewayFee(string $channelCode, int $grossAmount): ?int
    {
        if (! self::has($channelCode)) {
            return null;
        }

        $entry = self::CONTRACT[$channelCode];

        return $entry['flat'] + (int) round($grossAmount * ($entry['percent'] / 100));
    }
}
