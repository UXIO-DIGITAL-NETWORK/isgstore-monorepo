<?php

declare(strict_types=1);

namespace App\Support\Refund;

use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

/**
 * The refund promise: money back within 2x24 **working** hours.
 *
 * The clock starts when the customer claims, not when the refund is opened —
 * a refund sitting in WAITING_ACCOUNT is waiting on them, and putting our own
 * deadline on their inaction would report every unclaimed row as late forever.
 *
 * Working days are weekdays minus the holidays in `config/refund.php`. The
 * holiday list is config rather than a table because it is edited once a year
 * by whoever also edits the rest of the deployment's settings, and a wrong
 * entry costs an SLA badge, not money.
 */
final class RefundSla
{
    /** The promise, in working days. */
    public const WORKING_DAYS = 2;

    public static function dueAt(?CarbonInterface $from = null): Carbon
    {
        $cursor = Carbon::instance($from?->toDateTime() ?? now()->toDateTime());

        for ($added = 0; $added < self::WORKING_DAYS;) {
            $cursor = $cursor->addDay();

            if (self::isWorkingDay($cursor)) {
                $added++;
            }
        }

        return $cursor;
    }

    public static function isWorkingDay(CarbonInterface $date): bool
    {
        if ($date->isWeekend()) {
            return false;
        }

        return ! in_array($date->toDateString(), self::holidays(), true);
    }

    /** @return list<string> `Y-m-d` dates that do not count as working days. */
    public static function holidays(): array
    {
        $holidays = config('refund.holidays', []);

        return is_array($holidays) ? array_values(array_map('strval', $holidays)) : [];
    }
}
