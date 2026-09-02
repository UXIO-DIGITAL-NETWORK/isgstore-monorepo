<?php

declare(strict_types=1);

namespace App\Support\Report;

use DateTimeZone;
use Illuminate\Support\Carbon;

/**
 * Turns a period name (+ an optional custom range) into a UTC query window
 * computed in the *viewer's* timezone.
 *
 * `config('app.timezone')` is UTC and stays that way — payments, provider
 * callbacks and the hub reporting pulls all depend on it, and the TIMESTAMP
 * columns are genuinely UTC. What was missing is that report boundaries were
 * computed in UTC too, so a Jakarta admin opening "today" at 09:00 WIB got a
 * window starting seven hours into the previous local day.
 */
class PeriodResolver
{
    public const PERIODS = ['daily', 'monthly', 'yearly', 'custom'];

    /** Widest custom range we will aggregate; mirrored by GetReportSummaryRequest. */
    public const MAX_CUSTOM_DAYS = 366;

    /**
     * @param  string|null  $from  Y-m-d, only honoured when $period is 'custom'
     * @param  string|null  $to  Y-m-d (inclusive), only honoured when $period is 'custom'
     */
    public function resolve(
        string $period,
        ?string $from = null,
        ?string $to = null,
        ?string $timezone = null,
    ): PeriodRange {
        $tz = self::sanitizeTimezone($timezone);

        if ($period === 'custom' && $from !== null && $to !== null) {
            // Construct IN the zone. Carbon::parse($from)->setTimezone($tz)
            // would read app.timezone (UTC) first and then *move the instant*,
            // landing on the previous local day for any positive offset.
            $start = Carbon::parse($from, $tz)->startOfDay();
            $end = Carbon::parse($to, $tz)->addDay()->startOfDay();
            $label = $start->format('M j, Y').' – '.Carbon::parse($to, $tz)->format('M j, Y');
        } else {
            $period = in_array($period, ['monthly', 'yearly'], true) ? $period : 'daily';
            $now = Carbon::now($tz);

            // `addX()->startOfX()` rather than `startOfX()->addX()`: on a day
            // whose local midnight is deleted by a DST jump, startOfDay()
            // normalises forward, and adding to the normalised value would
            // leave a gap. Anchoring each bound to its own local midnight
            // keeps consecutive windows exactly contiguous.
            [$start, $end, $label] = match ($period) {
                'monthly' => [$now->copy()->startOfMonth(), $now->copy()->addMonth()->startOfMonth(), 'This month'],
                'yearly' => [$now->copy()->startOfYear(), $now->copy()->addYear()->startOfYear(), 'This year'],
                default => [$now->copy()->startOfDay(), $now->copy()->addDay()->startOfDay(), 'Today'],
            };
        }

        // Mandatory, and omitting it fails silently rather than loudly:
        // Connection::prepareBindings formats a DateTimeInterface using the
        // Carbon object's OWN timezone, with no conversion to app.timezone. A
        // Carbon at 2026-09-02 00:00 Asia/Jakarta binds as the literal string
        // "2026-09-02 00:00:00" and is compared against UTC-stored created_at.
        return new PeriodRange($start->utc(), $end->utc(), $period, $tz, $label);
    }

    /** "Now" as the viewer sees it on a wall clock, for callers that derive their own boundaries. */
    public static function now(?string $timezone): Carbon
    {
        return Carbon::now(self::sanitizeTimezone($timezone));
    }

    /**
     * `users.timezone` is only validated on login and on the sync endpoint —
     * StoreUserRequest/UpdateUserRequest accept any string up to 50 chars, so
     * an admin edited through the users CRUD can hold "WIB". Without this
     * guard that is a 500 on the reports page.
     */
    public static function sanitizeTimezone(?string $timezone): string
    {
        $fallback = config('app.timezone') ?: 'UTC';

        if ($timezone === null || $timezone === '') {
            return $fallback;
        }

        return in_array($timezone, timezone_identifiers_list(DateTimeZone::ALL_WITH_BC), true)
            ? $timezone
            : $fallback;
    }
}
