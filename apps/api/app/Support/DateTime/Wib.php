<?php

declare(strict_types=1);

namespace App\Support\DateTime;

use Illuminate\Support\Carbon;

/**
 * The platform's wall-clock zone: WIB, UTC+7.
 *
 * Storage stays UTC — `config('app.timezone')` is UTC and the TIMESTAMP columns
 * are genuinely UTC (see PeriodResolver for why that must not change). This
 * class is the presentation boundary instead: every date string rendered on the
 * server (invoice PDF, receipt email, notifications, WhatsApp messages) goes
 * through here, so it reads in WIB and says so.
 *
 * The frontends format in WIB themselves via their own date modules; this
 * exists only for the strings the server renders and sends.
 */
final class Wib
{
    /** IANA identifier — the one source of truth for the wall-clock zone. */
    public const TZ = 'Asia/Jakarta';

    /** Suffixed to any time of day, so a bare "18:15" is never ambiguous. */
    public const LABEL = 'WIB (GMT+7)';

    /** Date-only displays carry no offset, so the label is the short one. */
    public const DATE_LABEL = 'WIB';

    /**
     * An instant rendered in WIB, in the current locale, with the zone appended.
     */
    public static function format(?Carbon $at, string $pattern = 'd M Y, H:i'): ?string
    {
        return self::render($at, $pattern, self::LABEL);
    }

    /**
     * A calendar day in WIB — for dates where a time of day would be noise.
     */
    public static function date(?Carbon $at, string $pattern = 'd M Y'): ?string
    {
        return self::render($at, $pattern, self::DATE_LABEL);
    }

    private static function render(?Carbon $at, string $pattern, string $label): ?string
    {
        if ($at === null) {
            return null;
        }

        return $at->timezone(self::TZ)->translatedFormat($pattern).' '.$label;
    }
}
