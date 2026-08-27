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

    public function test_channel_sync_updates_fees_and_hub_owned_active_and_min(): void
    {
        $qris = PaymentChannel::factory()->create([
            'channel_code' => 'qris', 'fee_percent' => 0.7, 'tax_percent' => 0,
            'is_active' => false, 'min_amount' => 1000,
        ]);
        Http::fake(['hub.test/api/v1/sites/channel-settings' => Http::response([
            'status' => 'success', 'code' => 200, 'message' => 'ok',
            'data' => [
                [
                    'channel_code' => 'qris',
                    'fee_flat' => 0, 'fee_percent' => 0.9,
                    'gateway_fee_flat' => 0, 'gateway_fee_percent' => 0.7,
                    'tax_percent' => 11,
                    // Hub now owns these per site.
                    'is_active' => true, 'min_amount' => 5000,
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

        // The unknown row carries no name/payment_type, so there is nothing to
        // build a sellable channel from — it is still skipped, not created.
        $this->assertSame(['created' => 0, 'updated' => 1, 'skipped' => 1], $report);

        $qris->refresh();
        $this->assertSame(0.9, (float) $qris->fee_percent);
        $this->assertSame(11.0, (float) $qris->tax_percent);
        // The Hub now drives enablement + minimum per site.
        $this->assertTrue((bool) $qris->is_active);
        $this->assertSame(5000, (int) $qris->min_amount);
        $this->assertTrue((bool) $qris->hub_managed);
        $this->assertNull(PaymentChannel::where('channel_code', 'unknown_channel')->first());
    }

    public function test_channel_sync_creates_a_channel_the_site_has_never_seen(): void
    {
        // bri_va IS in the Monetapay contract, so it may go live immediately.
        Http::fake(['hub.test/api/v1/sites/channel-settings' => Http::response([
            'status' => 'success', 'code' => 200, 'message' => 'ok',
            'data' => [[
                'channel_code' => 'bri_va',
                'name' => 'BRI Virtual Account',
                'payment_type' => 'virtual_account',
                'fee_flat' => 1685, 'fee_percent' => 0,
                'gateway_fee_flat' => 1500, 'gateway_fee_percent' => 0,
                'tax_percent' => 11, 'is_active' => true, 'min_amount' => 10000,
            ]],
        ])]);

        $report = app(SyncChannelSettingsFromHubAction::class)->execute();

        $this->assertSame(['created' => 1, 'updated' => 0, 'skipped' => 0], $report);

        $created = PaymentChannel::where('channel_code', 'bri_va')->firstOrFail();
        $this->assertSame('BRI Virtual Account', $created->name);
        $this->assertSame('virtual_account', $created->payment_type);
        $this->assertSame(1685, (int) $created->fee_flat);
        $this->assertSame(10000, (int) $created->min_amount);
        $this->assertTrue((bool) $created->is_active);
        $this->assertTrue((bool) $created->hub_managed);
        // Presentation stays local — the storefront resolves logos by code.
        $this->assertNull($created->logo_path);
        $this->assertSame(0, (int) $created->sort_order);
        $this->assertTrue((bool) $created->is_single_use);
    }

    public function test_a_channel_absent_from_the_monetapay_contract_is_created_inactive(): void
    {
        // The gate that matters: an invented code is one MonetapayService would
        // send raw to the gateway (payment fails) AND one MerchantBalance
        // settles at T+0 (money withdrawable before Monetapay released it).
        Http::fake(['hub.test/api/v1/sites/channel-settings' => Http::response([
            'status' => 'success', 'code' => 200, 'message' => 'ok',
            'data' => [[
                'channel_code' => 'jenius_va',
                'name' => 'Jenius Virtual Account',
                'payment_type' => 'virtual_account',
                'fee_flat' => 1685, 'fee_percent' => 0,
                'gateway_fee_flat' => 1500, 'gateway_fee_percent' => 0,
                'tax_percent' => 11, 'is_active' => true, 'min_amount' => 10000,
            ]],
        ])]);

        app(SyncChannelSettingsFromHubAction::class)->execute();

        $created = PaymentChannel::where('channel_code', 'jenius_va')->firstOrFail();
        $this->assertFalse((bool) $created->is_active, 'an uncontracted channel must never go live from a Hub form alone');
        // It is still created and priced, so it goes live by itself the moment
        // finance adds the contract row — no second Hub edit needed.
        $this->assertSame(1685, (int) $created->fee_flat);
    }

    public function test_the_contract_gate_never_blocks_turning_a_channel_off(): void
    {
        $unlisted = PaymentChannel::factory()->create([
            'channel_code' => 'jenius_va', 'is_active' => true,
        ]);
        Http::fake(['hub.test/api/v1/sites/channel-settings' => Http::response([
            'status' => 'success', 'code' => 200, 'message' => 'ok',
            'data' => [[
                'channel_code' => 'jenius_va',
                'name' => 'Jenius Virtual Account', 'payment_type' => 'virtual_account',
                'fee_flat' => 0, 'fee_percent' => 0,
                'gateway_fee_flat' => 0, 'gateway_fee_percent' => 0,
                'tax_percent' => 11, 'is_active' => false,
            ]],
        ])]);

        app(SyncChannelSettingsFromHubAction::class)->execute();

        $this->assertFalse((bool) $unlisted->fresh()->is_active);
    }

    public function test_channel_sync_never_overwrites_payment_type_on_an_existing_row(): void
    {
        // payment_type picks the gateway endpoint and MonetapayService's match()
        // falls through to virtual_account — a Hub typo must not be able to
        // reroute a live, proven channel.
        $qris = PaymentChannel::factory()->create([
            'channel_code' => 'qris', 'payment_type' => 'qris', 'name' => 'QRIS lokal',
        ]);
        Http::fake(['hub.test/api/v1/sites/channel-settings' => Http::response([
            'status' => 'success', 'code' => 200, 'message' => 'ok',
            'data' => [[
                'channel_code' => 'qris',
                'name' => 'QRIS', 'payment_type' => 'virtual_account',
                'fee_flat' => 0, 'fee_percent' => 0.9,
                'gateway_fee_flat' => 0, 'gateway_fee_percent' => 0.7,
                'tax_percent' => 11,
            ]],
        ])]);

        app(SyncChannelSettingsFromHubAction::class)->execute();

        $qris->refresh();
        $this->assertSame('qris', $qris->payment_type, 'routing type is create-only');
        $this->assertSame('QRIS', $qris->name, 'but the display name is Hub-owned');
    }

    public function test_channel_sync_leaves_active_and_min_alone_when_hub_omits_them(): void
    {
        // An older Hub sends only fee fields — additive contract means the local
        // is_active / min_amount must be preserved, not zeroed.
        $qris = PaymentChannel::factory()->create([
            'channel_code' => 'qris', 'is_active' => true, 'min_amount' => 2500,
        ]);
        Http::fake(['hub.test/api/v1/sites/channel-settings' => Http::response([
            'status' => 'success', 'code' => 200, 'message' => 'ok',
            'data' => [[
                'channel_code' => 'qris',
                'fee_flat' => 0, 'fee_percent' => 0.9,
                'gateway_fee_flat' => 0, 'gateway_fee_percent' => 0.7,
                'tax_percent' => 11,
            ]],
        ])]);

        app(SyncChannelSettingsFromHubAction::class)->execute();

        $qris->refresh();
        $this->assertTrue((bool) $qris->is_active);
        $this->assertSame(2500, (int) $qris->min_amount);
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
