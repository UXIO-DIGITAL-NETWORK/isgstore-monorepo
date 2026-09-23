<?php

declare(strict_types=1);

namespace App\Support\Integration;

use App\Contracts\SupplierGateway;
use InvalidArgumentException;

/**
 * Picks the supplier adapter this site talks to.
 *
 * The transaction engine depends on `SupplierGateway`; which class answers it is
 * a config decision (`services.supplier.driver`), not a code decision. A client
 * on another supplier adds its adapter class to `services.supplier.adapters`
 * and names it in `SUPPLIER_DRIVER` — nothing in the engine changes.
 *
 * An unknown or non-conforming adapter fails LOUDLY here. The alternative —
 * resolving something that does not implement the contract — surfaces much
 * later, on the money path, as a fatal on an order.
 */
final class SupplierManager
{
    public static function make(?string $driver = null): SupplierGateway
    {
        $driver ??= (string) config('services.supplier.driver', 'uxiolabs');

        /** @var array<string,class-string> $adapters */
        $adapters = (array) config('services.supplier.adapters', []);
        $class = $adapters[$driver] ?? null;

        if (! is_string($class) || ! class_exists($class)) {
            throw new InvalidArgumentException(
                "Supplier driver [{$driver}] tidak dikenal. Terdaftar: "
                .(($adapters === []) ? '(kosong)' : implode(', ', array_keys($adapters)))
                .'. Lihat services.supplier.adapters.'
            );
        }

        $gateway = app($class);

        if (! $gateway instanceof SupplierGateway) {
            throw new InvalidArgumentException(
                "Adapter supplier [{$class}] tidak mengimplementasikan ".SupplierGateway::class.'.'
            );
        }

        return $gateway;
    }

    /**
     * Every driver key this site can be pointed at.
     *
     * @return array<int,string>
     */
    public static function drivers(): array
    {
        return array_keys((array) config('services.supplier.adapters', []));
    }
}
