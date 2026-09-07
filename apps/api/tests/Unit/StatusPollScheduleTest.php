<?php

namespace Tests\Unit;

use App\Support\Uxiolabs\StatusPollSchedule;
use PHPUnit\Framework\TestCase;

class StatusPollScheduleTest extends TestCase
{
    public function test_it_polls_every_5_seconds_for_the_first_2_minutes(): void
    {
        $this->assertSame(5, StatusPollSchedule::intervalSeconds(0));
        $this->assertSame(5, StatusPollSchedule::intervalSeconds(119));
    }

    public function test_it_widens_by_5_seconds_each_2_minute_tier(): void
    {
        $this->assertSame(10, StatusPollSchedule::intervalSeconds(120));
        $this->assertSame(10, StatusPollSchedule::intervalSeconds(239));
        $this->assertSame(15, StatusPollSchedule::intervalSeconds(240));
        $this->assertSame(20, StatusPollSchedule::intervalSeconds(360));
    }

    public function test_it_caps_the_interval_at_5_minutes(): void
    {
        $this->assertSame(300, StatusPollSchedule::intervalSeconds(86_400));
    }

    public function test_it_treats_negative_elapsed_as_zero(): void
    {
        $this->assertSame(5, StatusPollSchedule::intervalSeconds(-10));
    }
}
