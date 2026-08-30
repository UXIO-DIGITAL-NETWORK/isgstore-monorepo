<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The alarm for a silently dead queue worker.
 *
 * Its signal is deliberately "due and untouched" rather than "queue is
 * non-empty": PollUxiotopupStatusJob parks itself minutes into the future by
 * design, so a perfectly healthy queue is routinely full of rows that nobody
 * should be consuming yet.
 */
class QueueHealthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The command no-ops on any driver without a jobs table; the suite runs
        // on `sync`, so the checked path has to be selected explicitly.
        config([
            'queue.default' => 'database',
            'services.discord.webhook_log_url' => 'https://discord.test/hook',
        ]);
        Http::fake(['https://discord.test/*' => Http::response([], 204)]);
    }

    private function job(int $availableAtOffsetSeconds): void
    {
        DB::table('jobs')->insert([
            'queue' => 'default',
            'payload' => '{}',
            'attempts' => 0,
            'reserved_at' => null,
            'available_at' => time() + $availableAtOffsetSeconds,
            'created_at' => time(),
        ]);
    }

    public function test_it_stays_quiet_when_the_queue_is_empty(): void
    {
        $this->artisan('queue:health')->assertSuccessful();

        Http::assertNothingSent();
    }

    /** A job scheduled for the future is the healthy case, not a backlog. */
    public function test_a_job_not_due_yet_is_not_an_alarm(): void
    {
        $this->job(+600);

        $this->artisan('queue:health')->assertSuccessful();

        Http::assertNothingSent();
    }

    /** Nor is one that has only just come due — the worker gets a moment. */
    public function test_a_job_just_due_is_not_an_alarm(): void
    {
        $this->job(-30);

        $this->artisan('queue:health')->assertSuccessful();

        Http::assertNothingSent();
    }

    public function test_it_alerts_when_a_due_job_has_been_ignored(): void
    {
        $this->job(-1800);

        $this->artisan('queue:health')->assertSuccessful();

        Http::assertSent(fn ($request) => str_contains(
            json_encode($request->data()),
            'Queue worker tampaknya berhenti'
        ));
    }

    /** Under `sync` there is no worker to be dead, so it must not cry wolf. */
    public function test_it_is_a_noop_when_jobs_run_inline(): void
    {
        config(['queue.default' => 'sync']);
        $this->job(-1800);

        $this->artisan('queue:health')->assertSuccessful();

        Http::assertNothingSent();
    }
}
