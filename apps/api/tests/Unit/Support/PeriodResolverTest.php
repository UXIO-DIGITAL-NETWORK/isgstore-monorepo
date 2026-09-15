<?php

namespace Tests\Unit\Support;

use App\Support\Report\PeriodResolver;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PeriodResolverTest extends TestCase
{
    private PeriodResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resolver = new PeriodResolver;
    }

    public function test_daily_window_starts_at_local_midnight_expressed_in_utc(): void
    {
        // 09:00 WIB on 2 Sep = 02:00Z. The local day began at 2026-09-01T17:00Z.
        Carbon::setTestNow(Carbon::parse('2026-09-02T02:00:00Z'));

        $range = $this->resolver->resolve('daily', null, null, 'Asia/Jakarta');

        $this->assertSame('2026-09-01T17:00:00Z', $range->start->toIso8601ZuluString());
        $this->assertSame('2026-09-02T17:00:00Z', $range->endExclusive->toIso8601ZuluString());
        $this->assertSame('UTC', $range->start->tzName);
    }

    public function test_monthly_and_yearly_windows_follow_the_viewer_timezone(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-02T02:00:00Z'));

        $monthly = $this->resolver->resolve('monthly', null, null, 'Asia/Jakarta');
        $this->assertSame('2026-08-31T17:00:00Z', $monthly->start->toIso8601ZuluString());
        $this->assertSame('2026-09-30T17:00:00Z', $monthly->endExclusive->toIso8601ZuluString());

        $yearly = $this->resolver->resolve('yearly', null, null, 'Asia/Jakarta');
        $this->assertSame('2025-12-31T17:00:00Z', $yearly->start->toIso8601ZuluString());
        $this->assertSame('2026-12-31T17:00:00Z', $yearly->endExclusive->toIso8601ZuluString());
    }

    public function test_half_hour_offset_zone_is_handled(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-02T02:00:00Z'));

        $range = $this->resolver->resolve('daily', null, null, 'Asia/Kathmandu'); // +05:45

        $this->assertSame('2026-09-01T18:15:00Z', $range->start->toIso8601ZuluString());
    }

    public function test_consecutive_days_stay_contiguous_across_a_dst_transition(): void
    {
        // Adelaide moves +09:30 -> +10:30 at 02:00 local on 2026-10-04.
        Carbon::setTestNow(Carbon::parse('2026-10-03T12:00:00Z'));
        $before = $this->resolver->resolve('daily', null, null, 'Australia/Adelaide');

        Carbon::setTestNow(Carbon::parse('2026-10-04T12:00:00Z'));
        $after = $this->resolver->resolve('daily', null, null, 'Australia/Adelaide');

        // No gap and no overlap: one day's exclusive end is the next day's start.
        $this->assertTrue($before->endExclusive->equalTo($after->start));
        // ...and 4 Oct, the day the clocks jump forward, is genuinely 23h long.
        $this->assertSame(23, (int) $after->start->diffInHours($after->endExclusive));
    }

    public function test_invalid_timezone_falls_back_to_the_platform_zone_instead_of_throwing(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-02T02:00:00Z'));

        // "WIB" is a real zone name to a person but not to the tz database, and
        // the users CRUD used to accept any string. The fallback is the
        // platform's wall clock, not config('app.timezone') (UTC): a report
        // window and the time printed beside it must describe the same day.
        $range = $this->resolver->resolve('daily', null, null, 'WIB');

        $this->assertSame('Asia/Jakarta', $range->timezone);
        $this->assertSame('2026-09-01T17:00:00Z', $range->start->toIso8601ZuluString());
    }

    public function test_custom_range_is_built_in_the_viewer_zone_and_includes_date_to(): void
    {
        $range = $this->resolver->resolve('custom', '2026-09-01', '2026-09-03', 'Asia/Jakarta');

        $this->assertSame('2026-08-31T17:00:00Z', $range->start->toIso8601ZuluString());
        // Inclusive of 3 Sep: the exclusive bound is 4 Sep local midnight.
        $this->assertSame('2026-09-03T17:00:00Z', $range->endExclusive->toIso8601ZuluString());
        $this->assertSame('custom', $range->period);
    }

    public function test_unknown_period_falls_back_to_daily(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-02T02:00:00Z'));

        $this->assertSame('daily', $this->resolver->resolve('weekly', null, null, 'UTC')->period);
    }
}
