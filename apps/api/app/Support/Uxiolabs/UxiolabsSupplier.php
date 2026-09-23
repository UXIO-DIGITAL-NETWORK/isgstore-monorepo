<?php

declare(strict_types=1);

namespace App\Support\Uxiolabs;

use App\Models\Supplier;

/**
 * Resolves the uxiolabs supplier row.
 *
 * The whole provider pipeline is keyed on a supplier looked up by NAME —
 * `suppliers.name` has no unique index, and the value is seeded, not configured.
 * Centralising the lookup means the day that becomes a real integration id there
 * is one place to change instead of six.
 */
final class UxiolabsSupplier
{
    /** The supplier's current name in `suppliers.name` — the key this pipeline resolves on. */
    public const NAME = 'Uxiotopup';

    /**
     * What `suppliers.name` held before the 2026-09-16 rename.
     *
     * Still matched by every lookup here. The row is renamed by a migration, and
     * `php artisan migrate --force` runs before PHP-FPM is reloaded — so for a
     * few seconds the new code serves against the old row. A lookup that knew
     * only one spelling would 500 the price checker for that window.
     */
    public const LEGACY_NAME = 'Uxiolabs';

    /** @return array<int,string> Every name the row may currently carry. */
    public static function names(): array
    {
        return [self::NAME, self::LEGACY_NAME];
    }

    /**
     * Whether a name read from elsewhere refers to this supplier.
     *
     * For the comparisons that match a supplier by NAME outside a query — the
     * balance probe and the Integration channel card both do it, and both fail
     * SILENTLY when the spelling moves on (an empty figure, not an error).
     */
    public static function isNamed(?string $name): bool
    {
        if ($name === null) {
            return false;
        }

        $names = array_map(fn (string $known) => strtolower($known), self::names());

        return in_array(strtolower($name), $names, true);
    }

    public static function model(): ?Supplier
    {
        return Supplier::whereIn('name', self::names())->first();
    }

    /** For the callers that cannot proceed without the row at all. */
    public static function modelOrFail(): Supplier
    {
        return Supplier::whereIn('name', self::names())->firstOrFail();
    }

    public static function id(): ?int
    {
        $id = Supplier::whereIn('name', self::names())->value('id');

        return $id === null ? null : (int) $id;
    }
}
