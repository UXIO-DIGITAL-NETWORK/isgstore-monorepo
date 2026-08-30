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

    /**
     * The forms a phone number may have been stored in.
     *
     * `guest_contact` is persisted exactly as the customer typed it at checkout,
     * so "0812…", "62812…" and "+62812…" all exist in the table. Rather than
     * normalising the column (which would need a backfill and a functional
     * index), the small set of equivalent spellings is matched exactly — still
     * index-friendly, and no prefix search that could be walked.
     *
     * Returns [] for anything too short to be a phone number, so a caller can
     * skip the phone branch of its query entirely.
     *
     * Shared by "Cek Pesanan" (`TrackOrdersAction`) and the refund claim
     * lookup: two copies of these spelling rules would drift apart, and the
     * failure mode is a customer who cannot find their own money.
     *
     * @return list<string>
     */
    public static function candidates(string $value): array
    {
        $digits = preg_replace('/\D/', '', $value) ?? '';

        if (strlen($digits) < 8) {
            return [];
        }

        $national = str_starts_with($digits, '62') ? '0'.substr($digits, 2) : $digits;
        $international = str_starts_with($digits, '0') ? '62'.substr($digits, 1) : $digits;

        return array_values(array_unique([
            $value,
            $digits,
            $national,
            $international,
            '+'.$international,
        ]));
    }
}
