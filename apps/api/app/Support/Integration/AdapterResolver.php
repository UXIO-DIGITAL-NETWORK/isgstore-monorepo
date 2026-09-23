<?php

declare(strict_types=1);

namespace App\Support\Integration;

use InvalidArgumentException;

/**
 * Resolves a configured integration adapter, or fails loudly.
 *
 * Shared by every seam (supplier, payment gateway) so the failure behaviour is
 * identical and lives in one place: an unknown driver key, a class that does
 * not exist, or a class that does not implement the contract all stop here with
 * a named message. The alternative — resolving something unsuitable and finding
 * out later — surfaces on the money path instead.
 */
final class AdapterResolver
{
    /**
     * @param  string  $contract  the interface the adapter must implement
     * @param  string  $driver  the configured driver key
     * @param  array<string,mixed>  $adapters  driver key => adapter class
     */
    public static function resolve(string $contract, string $driver, array $adapters): object
    {
        $class = $adapters[$driver] ?? null;

        if (! is_string($class) || ! class_exists($class)) {
            throw new InvalidArgumentException(
                "Driver [{$driver}] tidak dikenal. Terdaftar: "
                .(($adapters === []) ? '(kosong)' : implode(', ', array_keys($adapters)))
                .'. Periksa config/services.php.'
            );
        }

        $adapter = app($class);

        if (! $adapter instanceof $contract) {
            throw new InvalidArgumentException(
                "Adapter [{$class}] tidak mengimplementasikan {$contract}."
            );
        }

        return $adapter;
    }
}
