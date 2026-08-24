<?php

declare(strict_types=1);

namespace App\Support\Uxiotopup;

use App\Models\Supplier;

/**
 * Resolves the uxiotopup supplier row.
 *
 * The whole provider pipeline is keyed on a supplier looked up by NAME —
 * `suppliers.name` has no unique index, and the value is seeded, not configured.
 * Centralising the lookup means the day that becomes a real integration id there
 * is one place to change instead of six.
 */
final class UxiotopupSupplier
{
    public const NAME = 'Uxiotopup';

    public static function model(): ?Supplier
    {
        return Supplier::where('name', self::NAME)->first();
    }

    public static function id(): ?int
    {
        $id = Supplier::where('name', self::NAME)->value('id');

        return $id === null ? null : (int) $id;
    }
}
