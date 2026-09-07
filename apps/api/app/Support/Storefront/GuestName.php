<?php

declare(strict_types=1);

namespace App\Support\Storefront;

/**
 * Display pseudonym for a guest who leaves feedback without an account.
 *
 * Letter-first then five zero-padded digits ("Guest K48213") so the name is
 * tidy, recognisable as a guest, and shown as-is on the public reviews list
 * (it is already anonymous, so it is not masked like a real member name).
 */
final class GuestName
{
    public static function generate(): string
    {
        return 'Guest '.chr(random_int(65, 90)).str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
    }
}
