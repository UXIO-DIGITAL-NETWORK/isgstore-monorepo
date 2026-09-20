<?php

declare(strict_types=1);

namespace App\Support\Hub;

/**
 * How often this site re-pulls from the Hub.
 *
 * One place for the arithmetic, because four commands share it and the Hub's own
 * pull has a twin: two notions of "how fresh is fresh" on one seam is how a fee
 * change lands on one side and not the other.
 *
 * A pull is a handful of cheap GETs, so the default is deliberately tight — a
 * change made in the Hub has to reach the client's site, and the client's bill,
 * while the operator is still watching.
 */
final class HubSyncSchedule
{
    /**
     * Minutes between pulls, floored at one.
     *
     * Cron cannot express "off", and a configured 0 would read as every minute
     * anyway — so an unusable value degrades to the tightest tick rather than to
     * silence. Pass a value to bypass config; omit to read it.
     */
    public static function intervalMinutes(?int $configured = null): int
    {
        $minutes = $configured ?? (int) config('services.hub.sync_interval_minutes', 1);

        return max(1, $minutes);
    }

    /** The cron expression every `hub:sync-*` command shares. */
    public static function cronExpression(?int $configured = null): string
    {
        return '*/'.self::intervalMinutes($configured).' * * * *';
    }
}
