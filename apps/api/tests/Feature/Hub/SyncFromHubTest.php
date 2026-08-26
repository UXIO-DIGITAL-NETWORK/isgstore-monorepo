<?php

declare(strict_types=1);

namespace Tests\Feature\Hub;

use App\Actions\Hub\SyncCatalogFromHubAction;
use App\Actions\Hub\SyncChannelSettingsFromHubAction;
use App\Models\PaymentChannel;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The site-side pull of the Hub's catalog and channel fee schedule. The hard
 * rules pinned here mirror the brief: match by code, never delete (only
 * deactivate), never touch cost_price / payment_channel_id / is_active-of-
 * channels, and treat an error envelope as failure — not as an empty list
 * that would deactivate everything.
 */
class SyncFromHubTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.hub.enabled' => true,
            'services.hub.base_url' => 'https://hub.test',
            'services.hub.api_key' => 'hub_live_sitekey',
        ]);
    }

    private function fakeCatalog(array $rows): void
    {
        Http::fake(['hub.test/api/v1/sites/catalog' => Http::response([
            'status' => 'success', 'code' => 200, 'message' => 'ok', 'data' => $rows,
        ])]);
    }

    private function catalogRow(array $overrides = []): array
    {
        return array_merge([
            'code' => 'uxiotopup',
            'name' => 'Uxiotopup Supplier',
            'category' => 'supplier',
            'description' => null,
            'features' => ['API topup'],
            'selling_price' => 250000,
            'duration_days' => 30,
            'is_active' => true,
            'sort_order' => 1,
        ], $overrides);
    }

    public function test_catalog_sync_creates_and_updates_by_code(): void
    {
        Service::create([
            'code' => 'uxiotopup', 'name' => 'Nama Lama', 'category' => 'supplier',
            'cost_price' => 100000, 'selling_price' => 200000, 'duration_days' => 30,
        ]);
        $this->fakeCatalog([
            $this->catalogRow(['selling_price' => 300000, 'name' => 'Nama Baru']),
            $this->catalogRow(['code' => 'domain', 'name' => 'Domain', 'selling_price' => 200000, 'duration_days' => 365]),
        ]);

        $report = app(SyncCatalogFromHubAction::class)->execute();

        $this->assertSame(['created' => 1, 'updated' => 1, 'deactivated' => 0], $report);

        $existing = Service::where('code', 'uxiotopup')->firstOrFail();
        $this->assertSame('Nama Baru', $existing->name);
        $this->assertSame(300000, (int) $existing->selling_price);
        // cost_price is the Hub's private margin data — never synced down.
        $this->assertSame(100000, (int) $existing->cost_price);

        $created = Service::where('code', 'domain')->firstOrFail();
        $this->assertSame(0, (int) $created->cost_price);
    }

    public function test_a_code_the_hub_stopped_sending_is_deactivated_never_deleted(): void
    {
        Service::create([
            'code' => 'legacy', 'name' => 'Legacy', 'category' => 'other',
            'selling_price' => 100000, 'duration_days' => 30, 'is_active' => true,
        ]);
        $this->fakeCatalog([$this->catalogRow()]);

        app(SyncCatalogFromHubAction::class)->execute();

        $legacy = Service::where('code', 'legacy')->first();
        $this->assertNotNull($legacy); // the row must survive — FKs cascade on delete
        $this->assertFalse((bool) $legacy->is_active);
    }

    public function test_catalog_sync_leaves_local_payment_channel_id_alone(): void
    {
        $channel = PaymentChannel::factory()->create();
        Service::create([
            'code' => 'uxiotopup', 'name' => 'X', 'category' => 'supplier',
            'selling_price' => 200000, 'duration_days' => 30,
            'payment_channel_id' => $channel->id,
        ]);
        $this->fakeCatalog([$this->catalogRow()]);

        app(SyncCatalogFromHubAction::class)->execute();

        $this->assertSame($channel->id, Service::where('code', 'uxiotopup')->first()->payment_channel_id);
    }

    public function test_an_error_envelope_aborts_instead_of_emptying_the_catalog(): void
    {
        Service::create([
            'code' => 'uxiotopup', 'name' => 'X', 'category' => 'supplier',
            'selling_price' => 200000, 'duration_days' => 30, 'is_active' => true,
        ]);
        Http::fake(['hub.test/*' => Http::response([
            'status' => 'error', 'code' => 403, 'message' => 'Forbidden.', 'data' => null,
        ])]);

        $this->expectException(\Exception::class);

        try {
            app(SyncCatalogFromHubAction::class)->execute();
        } finally {
            // Nothing was deactivated by the refused pull.
            $this->assertTrue((bool) Service::where('code', 'uxiotopup')->first()->is_active);
        }
    }

    public function test_channel_sync_updates_fees_but_never_is_active(): void
    {
        $qris = PaymentChannel::factory()->create([
            'channel_code' => 'qris', 'fee_percent' => 0.7, 'tax_percent' => 0, 'is_active' => false,
        ]);
        Http::fake(['hub.test/api/v1/sites/channel-settings' => Http::response([
            'status' => 'success', 'code' => 200, 'message' => 'ok',
            'data' => [
                [
                    'channel_code' => 'qris',
                    'fee_flat' => 0, 'fee_percent' => 0.9,
                    'gateway_fee_flat' => 0, 'gateway_fee_percent' => 0.7,
                    'tax_percent' => 11,
                ],
                [
                    // Not configured on this site — skipped, never created.
                    'channel_code' => 'unknown_channel',
                    'fee_flat' => 0, 'fee_percent' => 1,
                    'gateway_fee_flat' => 0, 'gateway_fee_percent' => 1,
                    'tax_percent' => 11,
                ],
            ],
        ])]);

        $report = app(SyncChannelSettingsFromHubAction::class)->execute();

        $this->assertSame(['updated' => 1, 'skipped' => 1], $report);

        $qris->refresh();
        $this->assertSame(0.9, (float) $qris->fee_percent);
        $this->assertSame(11.0, (float) $qris->tax_percent);
        // Which channels a site offers is the site's own call.
        $this->assertFalse((bool) $qris->is_active);
        $this->assertNull(PaymentChannel::where('channel_code', 'unknown_channel')->first());
    }

    public function test_the_commands_run_green(): void
    {
        $this->fakeCatalog([]);
        Http::fake([
            'hub.test/api/v1/sites/catalog' => Http::response(['status' => 'success', 'code' => 200, 'message' => 'ok', 'data' => []]),
            'hub.test/api/v1/sites/channel-settings' => Http::response(['status' => 'success', 'code' => 200, 'message' => 'ok', 'data' => []]),
        ]);

        $this->artisan('hub:sync-catalog')->assertExitCode(0);
        $this->artisan('hub:sync-channels')->assertExitCode(0);
    }
}
