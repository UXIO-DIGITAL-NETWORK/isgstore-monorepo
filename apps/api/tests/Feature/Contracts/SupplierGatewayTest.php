<?php

declare(strict_types=1);

namespace Tests\Feature\Contracts;

use App\Contracts\SupplierGateway;
use App\Support\Integration\SupplierManager;
use InvalidArgumentException;
use Tests\TestCase;

/**
 * The supplier seam itself, asserted — not the adapter behind it.
 *
 * The engine depends on `SupplierGateway`, so what must hold is: whatever
 * `services.supplier.driver` names is registered, exists, and conforms. Checked
 * by reflection rather than by resolving it, because building an adapter reads
 * credentials and this test should not need a database to fail loudly.
 */
class SupplierGatewayTest extends TestCase
{
    public function test_the_configured_driver_is_registered_and_conforms(): void
    {
        $driver = (string) config('services.supplier.driver');
        $adapters = (array) config('services.supplier.adapters');

        $this->assertArrayHasKey(
            $driver,
            $adapters,
            "Driver [{$driver}] tidak terdaftar di services.supplier.adapters."
        );

        $class = $adapters[$driver];

        $this->assertTrue(class_exists($class), "Kelas adapter [{$class}] tidak ditemukan.");
        $this->assertTrue(
            is_subclass_of($class, SupplierGateway::class),
            "Adapter [{$class}] wajib mengimplementasikan ".SupplierGateway::class.'.'
        );
    }

    public function test_an_unknown_driver_fails_loudly(): void
    {
        config(['services.supplier.driver' => 'supplier-yang-tidak-ada']);

        $this->expectException(InvalidArgumentException::class);

        SupplierManager::make();
    }
}
