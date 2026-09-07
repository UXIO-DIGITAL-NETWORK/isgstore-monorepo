<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Actions\Hub\SyncCatalogFromHubAction;
use App\Actions\Hub\SyncChannelSettingsFromHubAction;
use App\Jobs\Hub\RunHubSyncJob;
use App\Services\HubClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Reporting back to the Hub whether a poked sync actually landed.
 *
 * Until this existed the Hub could only ever know it had been ACCEPTED (our
 * 202) — so a site whose queue worker was dead looked exactly like one syncing
 * perfectly. The report is what makes "belum diterapkan" visible.
 */
class HubSyncAckTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.api_key' => 'read-key-xyz',
            'services.hub.base_url' => 'https://hub.test',
            'services.discord.webhook_log_url' => null,
        ]);
    }

    private function fakeHub(): void
    {
        Http::fake([
            'hub.test/api/v1/sites/catalog' => Http::response(['status' => 'success', 'data' => []]),
            'hub.test/api/v1/sites/channel-settings' => Http::response(['status' => 'success', 'data' => []]),
            'hub.test/api/v1/sites/sync-ack' => Http::response(['status' => 'success', 'data' => null]),
        ]);
    }

    public function test_a_completed_sync_reports_ok_to_the_hub(): void
    {
        $this->fakeHub();

        app(RunHubSyncJob::class, ['targets' => ['channels', 'catalog']])
            ->handle(
                app(SyncChannelSettingsFromHubAction::class),
                app(SyncCatalogFromHubAction::class),
                app(HubClient::class),
            );

        Http::assertSent(fn ($request) => $request->url() === 'https://hub.test/api/v1/sites/sync-ack'
            && $request['status'] === 'ok'
            && $request['targets'] === ['channels', 'catalog']
            && $request->hasHeader('X-Site-Key', 'read-key-xyz'));
    }

    public function test_an_exhausted_job_reports_failed_with_the_reason(): void
    {
        $this->fakeHub();

        (new RunHubSyncJob(['channels']))->failed(new \RuntimeException('Hub channel-settings error: HTTP 500'));

        Http::assertSent(fn ($request) => $request->url() === 'https://hub.test/api/v1/sites/sync-ack'
            && $request['status'] === 'failed'
            && str_contains((string) $request['message'], 'HTTP 500'));
    }

    /**
     * A sync that worked must never be undone by a report that could not be
     * delivered — the Hub re-derives the truth on its next pull anyway.
     */
    public function test_an_undeliverable_report_never_fails_the_sync(): void
    {
        Http::fake([
            'hub.test/api/v1/sites/catalog' => Http::response(['status' => 'success', 'data' => []]),
            'hub.test/api/v1/sites/channel-settings' => Http::response(['status' => 'success', 'data' => []]),
            'hub.test/api/v1/sites/sync-ack' => fn () => throw new \RuntimeException('connection refused'),
        ]);

        app(RunHubSyncJob::class, ['targets' => ['channels']])
            ->handle(
                app(SyncChannelSettingsFromHubAction::class),
                app(SyncCatalogFromHubAction::class),
                app(HubClient::class),
            );

        // No exception escaped.
        $this->assertTrue(true);
    }

    public function test_a_standalone_site_reports_nowhere(): void
    {
        config(['services.hub.base_url' => '', 'services.hub.api_key' => '']);
        Http::fake();

        app(HubClient::class)->reportSyncResult(['channels'], 'ok');

        Http::assertNothingSent();
    }
}
