<?php

declare(strict_types=1);

namespace App\Support\Integration;

use App\Contracts\PaymentGateway;

/**
 * Picks the payment-gateway adapter this site charges and pays out through.
 *
 * The engine depends on `PaymentGateway`; which class answers it is a config
 * decision (`services.payment.driver`), not a code decision. A client on another
 * gateway adds its adapter class to `services.payment.adapters` and names it in
 * `PAYMENT_DRIVER` — checkout, payouts, callbacks and the settlement sweeps are
 * untouched.
 *
 * @see AdapterResolver where an unknown driver fails loudly
 */
final class PaymentManager
{
    public static function make(?string $driver = null): PaymentGateway
    {
        $driver ??= (string) config('services.payment.driver', 'monetapay');

        /** @var PaymentGateway */
        return AdapterResolver::resolve(
            PaymentGateway::class,
            $driver,
            (array) config('services.payment.adapters', []),
        );
    }

    /**
     * Every driver key this site can be pointed at.
     *
     * @return array<int,string>
     */
    public static function drivers(): array
    {
        return array_keys((array) config('services.payment.adapters', []));
    }
}
