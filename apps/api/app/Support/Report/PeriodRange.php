<?php

declare(strict_types=1);

namespace App\Support\Report;

use Illuminate\Support\Carbon;

/**
 * A resolved reporting window.
 *
 * `start` and `endExclusive` are ALWAYS in UTC — see PeriodResolver for why
 * that is load-bearing rather than cosmetic. The interval is half-open:
 * `created_at >= start AND created_at < endExclusive`.
 */
readonly class PeriodRange
{
    public function __construct(
        public Carbon $start,
        public Carbon $endExclusive,
        public string $period,
        public string $timezone,
        /** Human label for the window, rendered as the stat-card caption. */
        public string $label,
    ) {}
}
