<?php

declare(strict_types=1);

namespace App\Support\Payment;

use App\Models\Payment;
use Carbon\CarbonInterface;

/**
 * When a pending payment stops being payable.
 *
 * The windows are Monetapay's `expire_seconds` per method plus a 5-minute grace
 * so the gateway's own callback can land before we declare the payment dead.
 *
 * Shared by `payments:sync-expired` (which reaps stale rows) and the public
 * invoice endpoint (which renders the countdown). Splitting these would let the
 * customer watch a timer that disagrees with the job about when they ran out of
 * time.
 */
final class PaymentExpiry
{
    /** @var array<string, int> payment_type => seconds after creation */
    public const WINDOWS = [
        'virtual_account' => 600 + 300,   // 15 min
        'qris' => 900 + 300,   // 20 min
        'ewallet' => 7200 + 300,   // 2 hr 5 min
        'payment_link' => 36000 + 300,   // 10 hr 5 min
        'convenience_store' => 86400 + 300,   // 24 hr 5 min
    ];

    public static function windowFor(?string $paymentType): ?int
    {
        return self::WINDOWS[$paymentType] ?? null;
    }

    /** Null when the payment type has no configured window — never guess one. */
    public static function for(Payment $payment): ?CarbonInterface
    {
        $window = self::windowFor($payment->paymentChannel?->payment_type);

        return $window && $payment->created_at
            ? $payment->created_at->copy()->addSeconds($window)
            : null;
    }

    public static function isExpired(Payment $payment): bool
    {
        return self::for($payment)?->isPast() ?? false;
    }
}
