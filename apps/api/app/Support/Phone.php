<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Normalises the phone/WhatsApp numbers captured at checkout (guest_contact) or
 * stored on a member (users.phone) into E.164, which PiWAPI accepts directly.
 *
 * Numbers arrive in whatever the customer typed — `0812…`, `62812…`, `+62 812…`,
 * with spaces or dashes — so callers can't assume a format.
 */
final class Phone
{
    /** Indonesian country code; the storefront is IDR/Indonesia-only. */
    private const DEFAULT_COUNTRY_CODE = '62';

    /**
     * Return the number in E.164 (`+62…`), or null when it is missing or too
     * short to be a real MSISDN (so callers can skip sending rather than push a
     * malformed recipient to the gateway).
     */
    public static function toE164(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $raw) ?? '';

        if ($digits === '') {
            return null;
        }

        // 0812… → 62812…  |  bare 812… → 62812…  |  62812… stays.
        if (str_starts_with($digits, '0')) {
            $digits = self::DEFAULT_COUNTRY_CODE.substr($digits, 1);
        } elseif (! str_starts_with($digits, self::DEFAULT_COUNTRY_CODE)) {
            $digits = self::DEFAULT_COUNTRY_CODE.$digits;
        }

        // A real Indonesian mobile number is at least ~10 digits including the
        // country code; anything shorter is a typo, not a number.
        if (strlen($digits) < 10) {
            return null;
        }

        return '+'.$digits;
    }
}
