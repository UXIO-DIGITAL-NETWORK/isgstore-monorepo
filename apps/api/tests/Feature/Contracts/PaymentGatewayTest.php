<?php

declare(strict_types=1);

namespace Tests\Feature\Contracts;

use App\Contracts\PaymentGateway;
use App\Support\Integration\PaymentManager;
use InvalidArgumentException;
use Tests\TestCase;

/**
 * The payment-gateway seam itself, asserted — not the adapter behind it.
 *
 * Same shape as SupplierGatewayTest: what must hold is that whatever
 * `services.payment.driver` names is registered, exists, and conforms. Checked
 * by reflection rather than by resolving it, so this test needs no database.
 */
class PaymentGatewayTest extends TestCase
{
    public function test_the_configured_driver_is_registered_and_conforms(): void
    {
        $driver = (string) config('services.payment.driver');
        $adapters = (array) config('services.payment.adapters');

        $this->assertArrayHasKey(
            $driver,
            $adapters,
            "Driver [{$driver}] tidak terdaftar di services.payment.adapters."
        );

        $class = $adapters[$driver];

        $this->assertTrue(class_exists($class), "Kelas adapter [{$class}] tidak ditemukan.");
        $this->assertTrue(
            is_subclass_of($class, PaymentGateway::class),
            "Adapter [{$class}] wajib mengimplementasikan ".PaymentGateway::class.'.'
        );
    }

    public function test_an_unknown_driver_fails_loudly(): void
    {
        config(['services.payment.driver' => 'gateway-yang-tidak-ada']);

        $this->expectException(InvalidArgumentException::class);

        PaymentManager::make();
    }
}
