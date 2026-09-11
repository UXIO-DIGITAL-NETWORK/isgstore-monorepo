<?php

declare(strict_types=1);

namespace App\Support\Locale;

/**
 * The languages this platform actually ships, in one place.
 *
 * Same reasoning as `Phone` and `Money`: the set was previously implied in
 * three unrelated spots — `config/app.php`, the `users.locale` column default,
 * and a hardcoded whitelist inside `GenerateInvoicePdfAction` — and those three
 * disagreed. `config('app.locale')` said `en` while the column default said
 * `id`, which is how every Google sign-up was stored as an English speaker.
 *
 * Adding a language means adding it here, adding `lang/<code>/`, and adding the
 * matching frontend namespace. Nothing should hardcode the pair again.
 */
final class SupportedLocale
{
    /** @var array<int,string> */
    public const ALL = ['id', 'en'];

    /** Whether the platform can answer in this language at all. */
    public static function supports(?string $locale): bool
    {
        return $locale !== null && in_array($locale, self::ALL, true);
    }

    /** The given locale, or null when it is not one this platform serves. */
    public static function normalise(?string $locale): ?string
    {
        if ($locale === null) {
            return null;
        }

        // `en-GB`, `id-ID`, `en_US` — the region says nothing we act on, and
        // there is no `en-GB` catalogue to fall back from.
        $base = strtolower(trim(explode('-', str_replace('_', '-', $locale))[0]));

        return self::supports($base) ? $base : null;
    }

    /** The platform default, for a caller who has expressed no preference. */
    public static function fallback(): string
    {
        return self::normalise((string) config('app.locale')) ?? 'id';
    }
}
