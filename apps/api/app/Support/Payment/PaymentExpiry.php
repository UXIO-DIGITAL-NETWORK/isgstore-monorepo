<?php

declare(strict_types=1);

namespace App\Support\Payment;

use App\Models\Payment;
use App\Models\Setting;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Cache;

/**
 * When a pending payment stops being payable.
 *
 * The windows are Monetapay's `expire_seconds` per method plus a 5-minute grace
 * so the gateway's own callback can land before we declare the payment dead.
 * They are admin-editable as of `order_expiry_minutes` — a single figure could
 * never have driven them, because the methods disagree by hours.
 *
 * Shared by `payments:sync-expired` (which reaps stale rows) and the public
 * invoice endpoint (which renders the countdown). Splitting these would let the
 * customer watch a timer that disagrees with the job about when they ran out of
 * time.
 */
final class PaymentExpiry
{
    /** The setting that overrides the defaults below, minutes per payment type. */
    public const SETTING_KEY = 'order_expiry_minutes';

    private const SETTING_GROUP = 'operational';

    private const CACHE_KEY = 'payment.expiry_minutes';

    private const CACHE_TTL = 300;

    /**
     * The shipped windows: `payment_type => seconds after creation`.
     *
     * These remain the fallback for any method the setting does not name, so a
     * half-filled setting can never leave a payment with no expiry at all.
     *
     * @var array<string, int>
     */
    public const WINDOWS = [
        'virtual_account' => 600 + 300,   // 15 min
        'qris' => 900 + 300,   // 20 min
        'ewallet' => 7200 + 300,   // 2 hr 5 min
        'payment_link' => 36000 + 300,   // 10 hr 5 min
        'convenience_store' => 86400 + 300,   // 24 hr 5 min
    ];

    /**
     * The configured windows, cached.
     *
     * `windowFor()` runs once per pending payment in `payments:sync-expired` and
     * again on the invoice endpoint the customer polls every few seconds, so
     * reading the settings table each time is not an option.
     *
     * The configured value is merged *over* the defaults rather than replacing
     * them: a method the admin did not name keeps its shipped window, and an
     * unrecognised key — a typo, a method from a newer gateway — is ignored
     * instead of becoming a payment that never expires.
     *
     * @return array<string, int>
     */
    public static function windows(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function (): array {
            $configured = Setting::query()
                ->where('group', self::SETTING_GROUP)
                ->where('key', self::SETTING_KEY)
                ->first()?->typedValue();

            if (! is_array($configured)) {
                return self::WINDOWS;
            }

            $windows = self::WINDOWS;

            foreach ($configured as $paymentType => $minutes) {
                if (
                    array_key_exists($paymentType, self::WINDOWS)
                    && is_numeric($minutes)
                    && (int) $minutes > 0
                ) {
                    $windows[$paymentType] = (int) $minutes * 60;
                }
            }

            return $windows;
        });
    }

    /** Called when the setting is written, so a save takes effect at once. */
    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public static function windowFor(?string $paymentType): ?int
    {
        return self::windows()[$paymentType] ?? null;
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
