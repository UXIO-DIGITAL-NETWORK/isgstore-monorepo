<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Models\PaymentChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The Hub's "your config changed" poke. It carries no data and moves no money —
 * the site still pulls everything itself with its own key — so unlike the
 * money-path write channel it is gated by the READ key alone. Making it depend
 * on HUB_WRITE_ENABLED would mean a site that accepts the Hub's reports but
 * refuses Hub-driven money movement silently loses fast fee updates.
 *
 * It applies the change INLINE and answers with the outcome. Queuing it made a
 * config update depend on this site's worker being alive; when it was not, the
 * Hub logged its 202 as a success and the fee sat unchanged with nothing
 * anywhere reporting a problem.
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
    }

    /** @param  array<int, array<string, mixed>>  $channels */
    private function fakeHub(array $channels = [], array $catalog = []): void
    {
        Http::fake([
            'hub.test/api/v1/sites/channel-settings' => Http::response(['status' => 'success', 'data' => $channels]),
            'hub.test/api/v1/sites/catalog' => Http::response(['status' => 'success', 'data' => $catalog]),
            'hub.test/api/v1/sites/licence' => Http::response(['status' => 'success', 'data' => [
                'status' => 'active',
                'is_serving' => true,
                'ends_at' => now()->addYear()->toIso8601String(),
            ]]),
        ]);
    }

    public function test_the_read_key_alone_applies_a_sync_on_the_spot(): void
    {
        $this->fakeHub();

        $this->postJson('/api/v1/hub/sync', ['targets' => ['channels']], ['X-Hub-Key' => self::READ])
            ->assertOk()
            ->assertJsonPath('data.applied', true)
            ->assertJsonPath('data.targets', ['channels']);

        // Applied means applied: the site really did go and fetch.
        Http::assertSent(fn ($request) => str_contains($request->url(), '/api/v1/sites/channel-settings'));
    }

    /** The whole point — the fee is live by the time the Hub's request returns. */
    public function test_the_change_is_visible_immediately_after_the_response(): void
    {
        PaymentChannel::factory()->create(['channel_code' => 'qris', 'fee_flat' => 0, 'fee_percent' => 0.5]);
        $this->fakeHub(channels: [[
            'channel_code' => 'qris', 'name' => 'QRIS', 'payment_type' => 'qris',
            'fee_flat' => 0, 'fee_percent' => 1.25,
            'gateway_fee_flat' => 0, 'gateway_fee_percent' => 0.7,
            'tax_percent' => 11, 'settlement_days' => 1, 'min_amount' => 10000, 'is_active' => true,
        ]]);

        $this->postJson('/api/v1/hub/sync', ['targets' => ['channels']], ['X-Hub-Key' => self::READ])
            ->assertOk()
            ->assertJsonPath('data.applied', true);

        $this->assertSame(1.25, (float) PaymentChannel::where('channel_code', 'qris')->value('fee_percent'));
    }

    public function test_it_defaults_to_every_target(): void
    {
        // The licence joined the default set deliberately: a bare poke is the
        // Hub saying "something of yours changed", and the one change that can
        // switch this site off should not need to be asked for by name.
        $this->fakeHub();

        $this->postJson('/api/v1/hub/sync', [], ['X-Hub-Key' => self::READ])
            ->assertOk()
            ->assertJsonPath('data.targets', ['channels', 'catalog', 'licence']);
    }

    /**
     * Reaching us and applying are different facts. A pull that failed is
     * reported as `applied: false` on a 200, so the Hub records the delivery as
     * fine and the application as failed — two columns, two truths.
     */
    public function test_a_failed_pull_reports_applied_false_rather_than_an_error_status(): void
    {
        Http::fake(['hub.test/*' => Http::response(['message' => 'boom'], 500)]);

        $this->postJson('/api/v1/hub/sync', ['targets' => ['channels']], ['X-Hub-Key' => self::READ])
            ->assertOk()
            ->assertJsonPath('data.applied', false);
    }

    public function test_it_never_needs_the_money_path_write_key(): void
    {
        // write_enabled is false and no write key is configured — this must
        // still work, or fast fee updates would be coupled to money movement.
        $this->fakeHub();

        $this->postJson('/api/v1/hub/sync', ['targets' => ['channels']], ['X-Hub-Key' => self::READ])
            ->assertOk();
    }

    public function test_a_missing_or_wrong_read_key_is_refused(): void
    {
        Http::fake();

        $this->postJson('/api/v1/hub/sync', [])->assertForbidden();
        $this->postJson('/api/v1/hub/sync', [], ['X-Hub-Key' => 'nope'])->assertForbidden();

        Http::assertNothingSent();
    }

    public function test_an_unknown_target_is_rejected(): void
    {
        Http::fake();

        $this->postJson('/api/v1/hub/sync', ['targets' => ['payments']], ['X-Hub-Key' => self::READ])
            ->assertStatus(422);

        Http::assertNothingSent();
    }
}
