<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Support\Hub\HubSyncSchedule;
use Tests\TestCase;

/**
 * The hub sync floor.
 *
 * A change made in the Hub — a fee, a plan line, a renewal — has to land on the
 * client's site, and on the client's bill, while the operator is still looking
 * at it. The plan used to sync every fifteen minutes and the licence every five,
 * which is long enough for an invoice nobody can see yet to look exactly like an
 * invoice that was never issued.
 *
 * The arithmetic lives in one place because all four `hub:sync-*` commands share
 * it; the wiring is a single `->cron(...)` per command in routes/console.php,
 * which routes/console.php evaluates at boot and so cannot be inspected with a
 * config the test sets afterwards.
 */
class HubSyncScheduleTest extends TestCase
{
    public function test_the_tick_is_one_minute_by_default(): void
    {
        // The requirement in one line: nothing configured, so the default runs.
        config(['services.hub.sync_interval_minutes' => 1]);

        $this->assertSame(1, HubSyncSchedule::intervalMinutes());
        $this->assertSame('*/1 * * * *', HubSyncSchedule::cronExpression());
    }

    public function test_a_configured_interval_drives_the_tick(): void
    {
        config(['services.hub.sync_interval_minutes' => 5]);

        $this->assertSame(5, HubSyncSchedule::intervalMinutes());
        $this->assertSame('*/5 * * * *', HubSyncSchedule::cronExpression());
    }

    public function test_a_nonsense_interval_still_pulls_once_a_minute(): void
    {
        // Cron cannot express "off". A 0 or a negative would otherwise be a tick
        // nobody can read — so it degrades to the tightest one, never to silence.
        $this->assertSame(1, HubSyncSchedule::intervalMinutes(0));
        $this->assertSame(1, HubSyncSchedule::intervalMinutes(-30));
        $this->assertSame('*/1 * * * *', HubSyncSchedule::cronExpression(0));
    }
}
