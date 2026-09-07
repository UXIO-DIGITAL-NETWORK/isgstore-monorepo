<?php

declare(strict_types=1);

namespace App\Support\Uxiolabs;

/**
 * Cadence for the per-order status poll chain (PollUxiolabsStatusJob), used
 * because the uxiolabs callback is unreliable. Poll fast while a fresh order is
 * most likely to flip, then widen the gap as it ages so a long-stuck order does
 * not hammer the supplier: 5s for the first 2 minutes, then +5s every 2-minute
 * tier (10s, 15s, …), capped at 5 minutes.
 */
final class StatusPollSchedule
{
    /** Past this age a still-PROCESSING order pages a human (once) — it does not stop polling. */
    public const STALE_SECONDS = 10800; // 3 hours

    private const TIER_SECONDS = 120;   // widen the interval every 2 minutes

    private const STEP_SECONDS = 5;     // 5s, 10s, 15s, …

    private const MAX_INTERVAL = 300;   // never wait more than 5 minutes between polls

    public static function intervalSeconds(int $elapsedSeconds): int
    {
        $tier = intdiv(max(0, $elapsedSeconds), self::TIER_SECONDS);

        return min(self::STEP_SECONDS * ($tier + 1), self::MAX_INTERVAL);
    }
}
