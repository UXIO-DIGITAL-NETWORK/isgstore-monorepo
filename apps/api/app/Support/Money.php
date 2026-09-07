<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Rupiah, written the way Indonesians write it.
 *
 * Money is stored as plain integer rupiah everywhere in this codebase — there
 * is no float money and no currency column — so this takes an int and returns
 * the one string every customer-facing surface should use.
 *
 * It exists because the codebase had drifted into two different formats. Three
 * Blade views each defined this identical closure, while most of `app/` called
 * bare `number_format($n)`, which uses **US separators**. The result was an
 * error message reading "Rp 1,500,000" for the very transaction whose invoice
 * PDF said "Rp 1.500.000". The missing "Rp" was the visible half of the
 * problem; the separators were the confusing half.
 *
 * Console output (`$this->table()`, dry-run listings) deliberately does not use
 * this — column alignment and greppability matter more there than typography.
 */
final class Money
{
    /** e.g. `Rp 1.500.000`. */
    public static function rupiah(int|float $amount): string
    {
        return 'Rp '.number_format((int) $amount, 0, ',', '.');
    }

    /** The bare number, e.g. `1.500.000`, for places that print their own label. */
    public static function digits(int|float $amount): string
    {
        return number_format((int) $amount, 0, ',', '.');
    }
}
