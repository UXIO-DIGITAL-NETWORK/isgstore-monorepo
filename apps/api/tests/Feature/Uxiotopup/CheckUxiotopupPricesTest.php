<?php

namespace Tests\Feature\Uxiotopup;

use App\Actions\Uxiotopup\CheckUxiotopupPricesAction;
use App\Enums\PriceAlertStatus;
use App\Models\PriceChangeAlert;
use App\Models\PricingRule;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CheckUxiotopupPricesTest extends TestCase
{
    use RefreshDatabase;

    private Supplier $uxiotopup;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.uxiotopup.api_key' => 'test-api-key']);

        $this->uxiotopup = Supplier::factory()->create(['name' => 'Uxiotopup']);
    }

    private function fakePriceList(array $items): void
    {
        Http::fake(['*/service' => Http::response([
            'status' => true,
            'msg' => 'Berhasil Mendapatkan Data Layanan',
            'data' => $items,
        ])]);
    }

    private function serviceItem(array $overrides = []): array
    {
        return array_merge([
            'id' => 'ML5',
            'nama_layanan' => 'Mobile Legends 5 Diamond',
            'kategori' => 'Mobile Legends',
            'harga' => 10000,
            'harga_gold' => 9800,
            'harga_silver' => 9900,
            'harga_pro' => 9700,
            'status' => 'aktif',
        ], $overrides);
    }

    private function seedMapping(int $cost = 10000, array $productOverrides = []): SupplierProduct
    {
        $product = Product::factory()->create(array_merge(['code' => 'ML5'], $productOverrides));

        return SupplierProduct::factory()->for($product)->for($this->uxiotopup)->create([
            'buyer_sku_code' => 'ML5',
            'price' => $cost,
            'is_active' => true,
        ]);
    }

    public function test_unknown_service_creates_nothing_and_is_counted(): void
    {
        $this->fakePriceList([$this->serviceItem(['id' => 'BRAND_NEW'])]);

        $report = app(CheckUxiotopupPricesAction::class)->execute();

        $this->assertSame(1, $report->unknownCount);
        $this->assertSame(['BRAND_NEW'], $report->unknownSkusSample);
        $this->assertDatabaseCount('products', 0);
        $this->assertDatabaseCount('supplier_products', 0);
        $this->assertDatabaseCount('price_change_alerts', 0);
    }

    public function test_cost_change_updates_cost_creates_alert_and_never_touches_selling_prices(): void
    {
        $mapping = $this->seedMapping(10000, ['price_member' => 12000]);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        $report = app(CheckUxiotopupPricesAction::class)->execute();

        $this->assertSame(1, $report->priceChangedCount);
        $this->assertSame(1, $report->alertsCreated);

        // Cost is factual — updated automatically.
        $this->assertDatabaseHas('supplier_products', ['buyer_sku_code' => 'ML5', 'price' => 12000]);

        // Selling prices are the admin's decision — never touched.
        $this->assertSame(12000, (int) $mapping->product->fresh()->price_member);

        $this->assertDatabaseHas('price_change_alerts', [
            'supplier_product_id' => $mapping->id,
            'buyer_sku_code' => 'ML5',
            'old_price' => 10000,
            'new_price' => 12000,
            'status' => PriceAlertStatus::PENDING->value,
        ]);
    }

    public function test_configured_price_tier_is_used_as_cost(): void
    {
        config(['services.uxiotopup.price_tier' => 'harga_gold']);

        $this->seedMapping(10000);
        $this->fakePriceList([$this->serviceItem(['harga' => 10000, 'harga_gold' => 9500])]);

        app(CheckUxiotopupPricesAction::class)->execute();

        $this->assertDatabaseHas('supplier_products', ['buyer_sku_code' => 'ML5', 'price' => 9500]);
    }

    public function test_selling_prices_untouched_even_with_pricing_rules_configured(): void
    {
        PricingRule::factory()->create(['role' => 'member', 'markup_percent' => 20, 'markup_flat' => 0]);
        $mapping = $this->seedMapping(10000, ['price_member' => 55555]);

        $this->fakePriceList([$this->serviceItem(['harga' => 11000])]);

        app(CheckUxiotopupPricesAction::class)->execute();

        $this->assertSame(55555, (int) $mapping->product->fresh()->price_member);
    }

    public function test_second_cost_change_updates_the_same_pending_alert(): void
    {
        $this->seedMapping(10000);

        Http::fake([
            '*/service' => Http::sequence()
                ->push(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem(['harga' => 12000])]])
                ->push(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem(['harga' => 13000])]]),
        ]);

        app(CheckUxiotopupPricesAction::class)->execute();
        $report = app(CheckUxiotopupPricesAction::class)->execute();

        $this->assertSame(1, $report->alertsUpdated);
        $this->assertDatabaseCount('price_change_alerts', 1);
        $this->assertDatabaseHas('price_change_alerts', [
            'buyer_sku_code' => 'ML5',
            'old_price' => 10000, // original cost preserved
            'new_price' => 13000, // tracks the latest
        ]);
    }

    public function test_cost_revert_deletes_the_pending_alert(): void
    {
        $this->seedMapping(10000);

        Http::fake([
            '*/service' => Http::sequence()
                ->push(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem(['harga' => 12000])]])
                ->push(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem(['harga' => 10000])]]),
        ]);

        app(CheckUxiotopupPricesAction::class)->execute();
        app(CheckUxiotopupPricesAction::class)->execute();

        $this->assertDatabaseCount('price_change_alerts', 0);
        $this->assertDatabaseHas('supplier_products', ['buyer_sku_code' => 'ML5', 'price' => 10000]);
    }

    public function test_acknowledged_alert_gets_a_fresh_pending_row_on_next_change(): void
    {
        $mapping = $this->seedMapping(10000);

        PriceChangeAlert::factory()->acknowledged()->create([
            'supplier_product_id' => $mapping->id,
            'buyer_sku_code' => 'ML5',
            'old_price' => 9000,
            'new_price' => 10000,
        ]);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        $report = app(CheckUxiotopupPricesAction::class)->execute();

        $this->assertSame(1, $report->alertsCreated);
        $this->assertDatabaseCount('price_change_alerts', 2); // history kept + new pending
        $this->assertDatabaseHas('price_change_alerts', [
            'old_price' => 10000,
            'new_price' => 12000,
            'status' => PriceAlertStatus::PENDING->value,
        ]);
    }

    public function test_nonaktif_service_is_deactivated_and_reactivated_only_by_checker(): void
    {
        $mapping = $this->seedMapping();

        Http::fake([
            '*/service' => Http::sequence()
                ->push(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem(['status' => 'nonaktif'])]])
                ->push(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem()]]),
        ]);

        $report = app(CheckUxiotopupPricesAction::class)->execute();

        $mapping->refresh();
        $this->assertSame(['ML5'], $report->deactivated);
        $this->assertFalse((bool) $mapping->is_active);
        $this->assertNotNull($mapping->sync_deactivated_at);

        $report = app(CheckUxiotopupPricesAction::class)->execute();

        $mapping->refresh();
        $this->assertSame(['ML5'], $report->reactivated);
        $this->assertTrue((bool) $mapping->is_active);
        $this->assertNull($mapping->sync_deactivated_at);
    }

    public function test_manually_deactivated_mapping_is_never_reactivated(): void
    {
        $product = Product::factory()->create(['code' => 'ML5']);
        $mapping = SupplierProduct::factory()->for($product)->for($this->uxiotopup)->create([
            'buyer_sku_code' => 'ML5',
            'price' => 10000,
            'is_active' => false,
            'sync_deactivated_at' => null, // admin turned it off, not the checker
        ]);

        $this->fakePriceList([$this->serviceItem()]);
        app(CheckUxiotopupPricesAction::class)->execute();

        $this->assertFalse((bool) $mapping->fresh()->is_active);
    }

    public function test_negative_margin_products_are_reported(): void
    {
        $this->seedMapping(10000, ['price_member' => 12000]);

        $this->fakePriceList([$this->serviceItem(['harga' => 15000])]);

        $report = app(CheckUxiotopupPricesAction::class)->execute();

        $this->assertCount(1, $report->negativeMargin);
        $this->assertSame('ML5', $report->negativeMargin[0]['sku']);
    }

    public function test_error_envelope_is_rejected_not_treated_as_empty_list(): void
    {
        Http::fake(['*/service' => Http::response([
            'status' => false,
            'msg' => 'api_key tidak ditemukan',
            'data' => [],
        ])]);

        $this->expectExceptionMessage('api_key tidak ditemukan');

        app(CheckUxiotopupPricesAction::class)->execute();
    }

    public function test_check_prices_command_runs_quietly(): void
    {
        $this->fakePriceList([$this->serviceItem()]);

        $this->artisan('uxiotopup:check-prices')->assertExitCode(0);
    }

    public function test_sync_products_command_runs_and_reports_to_discord(): void
    {
        config(['services.discord.webhook_log_url' => 'https://discord.test/webhook']);

        $this->seedMapping();
        Http::fake([
            '*/service' => Http::response(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem(['harga' => 11000])]]),
            'discord.test/*' => Http::response([]),
        ]);

        $this->artisan('uxiotopup:sync-products')->assertExitCode(0);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'discord.test'));
    }

    public function test_command_fails_when_uxiotopup_is_unreachable(): void
    {
        Http::fake(['*/service' => Http::response('server error', 500)]);

        $this->artisan('uxiotopup:check-prices')->assertExitCode(1);
    }
}
