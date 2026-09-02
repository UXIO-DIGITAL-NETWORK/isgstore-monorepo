<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Normalises the phone/WhatsApp numbers captured at checkout (`guest_contact`)
 * or stored on a member (`users.phone`) into E.164 — the form PiWAPI accepts
 * directly, and the canonical form this application stores.
 *
 * Numbers arrive in whatever the customer typed: `0812…`, `62812…`, `+62 812…`,
 * `0065 9123 4567`. Any country is accepted; a number that carries its own
 * `+<code>` is respected as typed. Only a number with no country code at all
 * falls back to the storefront's default country, which is what keeps the
 * ordinary Indonesian `0812…` working without a country picker.
 *
 * A canonical number never starts with `0` — E.164 country codes cannot.
 */
final class Phone
{
    /** E.164 allows 8..15 significant digits; anything shorter is a typo. */
    private const MIN_DIGITS = 8;

    private const MAX_DIGITS = 15;

    /**
     * Return the number in E.164 (`+6281234567890`), or null when it is missing
     * or not plausibly a number — so callers can skip sending rather than push a
     * malformed recipient to a gateway.
     *
     * @param  string|null  $defaultCountryCode  Applied only to a number that
     *                                           carries no country code of its own.
     */
    public static function toE164(?string $raw, ?string $defaultCountryCode = null): ?string
    {
        if ($raw === null) {
            return null;
        }

        $raw = trim($raw);

        if ($raw === '') {
            return null;
        }

        $default = $defaultCountryCode ?? self::defaultCountryCode();

        // An explicit "+<code>" is the customer telling us their country. Never
        // second-guess it — that is the whole of international support here.
        if (str_starts_with($raw, '+')) {
            $digits = self::digits($raw);
        } else {
            $digits = self::digits($raw);

            if ($digits === '') {
                return null;
            }

            if (str_starts_with($digits, '00')) {
                // "00" is the international call prefix in most of the world:
                // what follows is already a country code.
                $digits = substr($digits, 2);
            } elseif (str_starts_with($digits, '0')) {
                // National format — trunk zero replaced by the default country.
                $digits = $default.ltrim($digits, '0');
            } elseif (! str_starts_with($digits, $default)) {
                // A bare national number with no trunk zero. Assumed local; see
                // the note in candidates() about what that costs.
                $digits = $default.$digits;
            }
        }

        $length = strlen($digits);

        if ($length < self::MIN_DIGITS || $length > self::MAX_DIGITS) {
            return null;
        }

        // A country code never begins with 0, so this cannot produce one.
        if (str_starts_with($digits, '0')) {
            return null;
        }

        return '+'.$digits;
    }

    /**
     * The forms a phone number may have been stored in.
     *
     * Contact columns are only normalised on write from the release that
     * introduced E.164, and the existing rows were deliberately not migrated —
     * so `0812…`, `62812…` and `+62812…` all still exist side by side in the
     * same column. Rather than normalising the data (which would need a backfill
     * and a dedupe strategy against `users.phone`'s unique index), the small set
     * of equivalent spellings is matched exactly: still index-friendly, and no
     * prefix search that could be walked.
     *
     * Only the default country has a national (`0…`) spelling worth generating;
     * a number from anywhere else was never written in a local form here, so its
     * candidate set is just what it is.
     *
     * Returns [] for anything too short to be a phone number, so a caller can
     * skip the phone branch of its query entirely. **Do not lower that floor** —
     * it is what stops a short prefix from being cheap to iterate over, and it
     * happens to coincide with E.164's own minimum.
     *
     * Known and accepted: a foreign number typed *bare* (a Singaporean
     * `91234567` with no `+`) is read as local, so its candidates include
     * `+6291234567` and could exactly match an unrelated Indonesian row. That is
     * inherent to supporting country codes without a country picker — it is an
     * exact collision, not enumeration.
     *
     * Shared by "Cek Pesanan" (`TrackOrdersAction`), the refund claim lookup and
     * `RefundContactMatcher`: separate copies of these spelling rules would drift
     * apart, and the failure mode is a customer who cannot find their own money.
     *
     * @return list<string>
     */
    public static function candidates(string $value, ?string $defaultCountryCode = null): array
    {
        $digits = self::digits($value);

        if (strlen($digits) < self::MIN_DIGITS) {
            return [];
        }

        $default = $defaultCountryCode ?? self::defaultCountryCode();

        // No `+0…`: a plus is a country code marker and a country code never
        // starts with zero, so that spelling can match nothing and would only
        // widen every lookup.
        $spellings = str_starts_with($digits, '0')
            ? [$value, $digits]
            : [$value, $digits, '+'.$digits];

        if (str_starts_with($digits, $default)) {
            $national = '0'.substr($digits, strlen($default));
            $spellings[] = $national;
        } elseif (str_starts_with($digits, '0')) {
            $international = $default.ltrim($digits, '0');
            $spellings[] = $international;
            $spellings[] = '+'.$international;
        }

        return array_values(array_unique($spellings));
    }

    /**
     * The Indonesian national spelling (`08…`), or null when the number is not
     * Indonesian.
     *
     * Needed because two integrations are Indonesia-bound in a way the contact
     * columns no longer are: Monetapay settles in IDR to Indonesian banks and
     * e-wallets, where the phone is the beneficiary's wallet identity. Handing
     * those a foreign number would fail after money had already moved, so
     * callers fall back to their own placeholder on null instead.
     */
    public static function toIndonesianLocal(?string $raw, ?string $defaultCountryCode = null): ?string
    {
        $e164 = self::toE164($raw, $defaultCountryCode);

        if ($e164 === null || ! str_starts_with($e164, '+62')) {
            return null;
        }

        return '0'.substr($e164, 3);
    }

    private static function digits(string $value): string
    {
        return preg_replace('/\D+/', '', $value) ?? '';
    }

    private static function defaultCountryCode(): string
    {
        $code = (string) config('services.storefront.default_country_code', '62');

        return $code === '' ? '62' : $code;
    }
}
