<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Jobs\Hub\RunHubSyncJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * The Hub's "your config changed" poke. It carries no data and moves no money —
 * the site still pulls everything itself with its own key — so unlike the
 * money-path write channel it is gated by the READ key alone. Making it depend
 * on HUB_WRITE_ENABLED would mean a site that accepts the Hub's reports but
 * refuses Hub-driven money movement silently loses fast fee updates.
 */
class HubSyncTriggerTest extends TestCase
{
    use RefreshDatabase;

    private const READ = 'read-key-xyz';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.api_key' => self::READ,
            'services.hub.base_url' => 'https://hub.test',
            // Deliberately OFF for every test in this file.
            'services.hub.write_enabled' => false,
            'services.hub.write_api_key' => null,
        ]);

        Queue::fake();
    }

    public function test_the_read_key_alone_queues_a_sync(): void
    {
        $this->postJson('/api/v1/hub/sync', ['targets' => ['channels']], ['X-Hub-Key' => self::READ])
            ->assertStatus(202)
            ->assertJsonPath('data.queued', true)
            ->assertJsonPath('data.targets', ['channels']);

        Queue::assertPushed(RunHubSyncJob::class, fn (RunHubSyncJob $job) => $job->targets === ['channels']);
    }

    public function test_it_defaults_to_both_targets(): void
    {
        $this->postJson('/api/v1/hub/sync', [], ['X-Hub-Key' => self::READ])
            ->assertStatus(202);

        Queue::assertPushed(RunHubSyncJob::class, fn (RunHubSyncJob $job) => $job->targets === ['channels', 'catalog']);
    }

    public function test_it_never_needs_the_money_path_write_key(): void
    {
        // write_enabled is false and no write key is configured — this must
        // still work, or fast fee updates would be coupled to money movement.
        $this->postJson('/api/v1/hub/sync', ['targets' => ['channels']], ['X-Hub-Key' => self::READ])
            ->assertStatus(202);
    }

    public function test_a_missing_or_wrong_read_key_is_refused(): void
    {
        $this->postJson('/api/v1/hub/sync', [])->assertForbidden();
        $this->postJson('/api/v1/hub/sync', [], ['X-Hub-Key' => 'nope'])->assertForbidden();

        Queue::assertNothingPushed();
    }

    public function test_an_unknown_target_is_rejected(): void
    {
        $this->postJson('/api/v1/hub/sync', ['targets' => ['payments']], ['X-Hub-Key' => self::READ])
            ->assertStatus(422);

        Queue::assertNothingPushed();
    }

    public function test_repeated_pokes_collapse_to_one_run(): void
    {
        // Five saves in a row is five pokes; the job is unique for a minute, so
        // the site pulls once. The id is what makes that hold.
        $a = new RunHubSyncJob(['channels']);
        $b = new RunHubSyncJob(['channels']);
        $this->assertSame($a->uniqueId(), $b->uniqueId());

        // Target order must not matter, or the collapse silently stops working.
        $this->assertSame(
            (new RunHubSyncJob(['channels', 'catalog']))->uniqueId(),
            (new RunHubSyncJob(['catalog', 'channels']))->uniqueId(),
        );
    }
}
