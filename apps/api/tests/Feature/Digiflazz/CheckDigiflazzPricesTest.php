<?php

namespace Tests\Feature\Digiflazz;

use App\Actions\Digiflazz\CheckDigiflazzPricesAction;
use App\Enums\PriceAlertStatus;
use App\Models\PriceChangeAlert;
use App\Models\PricingRule;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CheckDigiflazzPricesTest extends TestCase
{
    use RefreshDatabase;

    private Supplier $digiflazz;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.digiflazz.username' => 'testuser',
            'services.digiflazz.key' => 'testkey',
        ]);

        $this->digiflazz = Supplier::factory()->create(['name' => 'Digiflazz']);
    }

    private function fakePriceList(array $items): void
    {
        Http::fake(['*/price-list' => Http::response(['data' => $items])]);
    }

    private function prepaidItem(array $overrides = []): array
    {
        return array_merge([
            'product_name' => 'Mobile Legends 5 Diamond',
            'category' => 'Games',
            'brand' => 'MOBILE LEGENDS',
            'type' => 'Umum',
            'seller_name' => 'Seller',
            'price' => 10000,
            'buyer_sku_code' => 'ml5',
            'buyer_product_status' => true,
            'seller_product_status' => true,
        ], $overrides);
    }

    private function seedMapping(int $cost = 10000, array $productOverrides = []): SupplierProduct
    {
        $product = Product::factory()->create(array_merge(['code' => 'ml5'], $productOverrides));

        return SupplierProduct::factory()->for($product)->for($this->digiflazz)->create([
            'buyer_sku_code' => 'ml5',
            'price' => $cost,
            'is_active' => true,
        ]);
    }

    public function test_unknown_sku_creates_nothing_and_is_counted(): void
    {
        $this->fakePriceList([$this->prepaidItem(['buyer_sku_code' => 'brand-new-sku'])]);

        $report = app(CheckDigiflazzPricesAction::class)->execute('prepaid');

        $this->assertSame(1, $report->unknownCount);
        $this->assertSame(['brand-new-sku'], $report->unknownSkusSample);
        $this->assertDatabaseCount('products', 0);
        $this->assertDatabaseCount('supplier_products', 0);
        $this->assertDatabaseCount('price_change_alerts', 0);
    }

    public function test_cost_change_updates_cost_creates_alert_and_never_touches_selling_prices(): void
    {
        $mapping = $this->seedMapping(10000, ['price_member' => 12000]);

        $this->fakePriceList([$this->prepaidItem(['price' => 12000])]);

        $report = app(CheckDigiflazzPricesAction::class)->execute('prepaid');

        $this->assertSame(1, $report->priceChangedCount);
        $this->assertSame(1, $report->alertsCreated);

        // Cost is factual — updated automatically.
        $this->assertDatabaseHas('supplier_products', ['buyer_sku_code' => 'ml5', 'price' => 12000]);

        // Selling prices are the admin's decision — never touched.
        $this->assertSame(12000, (int) $mapping->product->fresh()->price_member);

        $this->assertDatabaseHas('price_change_alerts', [
            'supplier_product_id' => $mapping->id,
            'buyer_sku_code' => 'ml5',
            'old_price' => 10000,
            'new_price' => 12000,
            'status' => PriceAlertStatus::PENDING->value,
        ]);
    }

    public function test_selling_prices_untouched_even_with_pricing_rules_configured(): void
    {
        PricingRule::factory()->create(['role' => 'member', 'markup_percent' => 20, 'markup_flat' => 0]);
        $mapping = $this->seedMapping(10000, ['price_member' => 55555]);

        $this->fakePriceList([$this->prepaidItem(['price' => 11000])]);

        app(CheckDigiflazzPricesAction::class)->execute('prepaid');

        $this->assertSame(55555, (int) $mapping->product->fresh()->price_member);
    }

    public function test_second_cost_change_updates_the_same_pending_alert(): void
    {
        $this->seedMapping(10000);

        Http::fake([
            '*/price-list' => Http::sequence()
                ->push(['data' => [$this->prepaidItem(['price' => 12000])]])
                ->push(['data' => [$this->prepaidItem(['price' => 13000])]]),
        ]);

        app(CheckDigiflazzPricesAction::class)->execute('prepaid');
        $report = app(CheckDigiflazzPricesAction::class)->execute('prepaid');

        $this->assertSame(1, $report->alertsUpdated);
        $this->assertDatabaseCount('price_change_alerts', 1);
        $this->assertDatabaseHas('price_change_alerts', [
            'buyer_sku_code' => 'ml5',
            'old_price' => 10000, // original cost preserved
            'new_price' => 13000, // tracks the latest
        ]);
    }

    public function test_cost_revert_deletes_the_pending_alert(): void
    {
        $this->seedMapping(10000);

        Http::fake([
            '*/price-list' => Http::sequence()
                ->push(['data' => [$this->prepaidItem(['price' => 12000])]])
                ->push(['data' => [$this->prepaidItem(['price' => 10000])]]),
        ]);

        app(CheckDigiflazzPricesAction::class)->execute('prepaid');
        app(CheckDigiflazzPricesAction::class)->execute('prepaid');

        $this->assertDatabaseCount('price_change_alerts', 0);
        $this->assertDatabaseHas('supplier_products', ['buyer_sku_code' => 'ml5', 'price' => 10000]);
    }

    public function test_acknowledged_alert_gets_a_fresh_pending_row_on_next_change(): void
    {
        $mapping = $this->seedMapping(10000);

        PriceChangeAlert::factory()->acknowledged()->create([
            'supplier_product_id' => $mapping->id,
            'buyer_sku_code' => 'ml5',
            'old_price' => 9000,
            'new_price' => 10000,
        ]);

        $this->fakePriceList([$this->prepaidItem(['price' => 12000])]);

        $report = app(CheckDigiflazzPricesAction::class)->execute('prepaid');

        $this->assertSame(1, $report->alertsCreated);
        $this->assertDatabaseCount('price_change_alerts', 2); // history kept + new pending
        $this->assertDatabaseHas('price_change_alerts', [
            'old_price' => 10000,
            'new_price' => 12000,
            'status' => PriceAlertStatus::PENDING->value,
        ]);
    }

    public function test_unavailable_sku_is_deactivated_and_reactivated_only_by_checker(): void
    {
        $mapping = $this->seedMapping();

        Http::fake([
            '*/price-list' => Http::sequence()
                ->push(['data' => [$this->prepaidItem(['seller_product_status' => false])]])
                ->push(['data' => [$this->prepaidItem()]]),
        ]);

        $report = app(CheckDigiflazzPricesAction::class)->execute('prepaid');

        $mapping->refresh();
        $this->assertSame(['ml5'], $report->deactivated);
        $this->assertFalse((bool) $mapping->is_active);
        $this->assertNotNull($mapping->sync_deactivated_at);

        $report = app(CheckDigiflazzPricesAction::class)->execute('prepaid');

        $mapping->refresh();
        $this->assertSame(['ml5'], $report->reactivated);
        $this->assertTrue((bool) $mapping->is_active);
        $this->assertNull($mapping->sync_deactivated_at);
    }

    public function test_manually_deactivated_mapping_is_never_reactivated(): void
    {
        $product = Product::factory()->create(['code' => 'ml5']);
        $mapping = SupplierProduct::factory()->for($product)->for($this->digiflazz)->create([
            'buyer_sku_code' => 'ml5',
            'price' => 10000,
            'is_active' => false,
            'sync_deactivated_at' => null, // admin turned it off, not the checker
        ]);

        $this->fakePriceList([$this->prepaidItem()]);
        app(CheckDigiflazzPricesAction::class)->execute('prepaid');

        $this->assertFalse((bool) $mapping->fresh()->is_active);
    }

    public function test_pasca_check_stores_admin_fee_and_commission_and_alerts_on_admin_change(): void
    {
        $product = Product::factory()->create(['code' => 'pln']);
        SupplierProduct::factory()->for($product)->for($this->digiflazz)->create([
            'buyer_sku_code' => 'pln',
            'price' => 2000,
        ]);

        $this->fakePriceList([[
            'product_name' => 'PLN Pascabayar',
            'category' => 'PLN',
            'brand' => 'PLN',
            'seller_name' => 'Seller',
            'admin' => 2500,
            'commission' => 1200,
            'buyer_sku_code' => 'pln',
            'buyer_product_status' => true,
            'seller_product_status' => true,
        ]]);

        $report = app(CheckDigiflazzPricesAction::class)->execute('pasca');

        $this->assertDatabaseHas('supplier_products', [
            'buyer_sku_code' => 'pln',
            'price' => 2500,
            'admin_fee' => 2500,
            'commission' => 1200,
        ]);
        $this->assertSame(1, $report->alertsCreated);
        $this->assertDatabaseHas('price_change_alerts', [
            'buyer_sku_code' => 'pln',
            'type' => 'pasca',
            'old_price' => 2000,
            'new_price' => 2500,
        ]);
    }

    public function test_negative_margin_products_are_reported(): void
    {
        $this->seedMapping(10000, ['price_member' => 12000]);

        $this->fakePriceList([$this->prepaidItem(['price' => 15000])]);

        $report = app(CheckDigiflazzPricesAction::class)->execute('prepaid');

        $this->assertCount(1, $report->negativeMargin);
        $this->assertSame('ml5', $report->negativeMargin[0]['sku']);
    }

    public function test_check_prices_command_runs_quietly(): void
    {
        $this->fakePriceList([$this->prepaidItem()]);

        $this->artisan('digiflazz:check-prices --type=prepaid')->assertExitCode(0);
    }

    public function test_sync_products_command_runs_and_reports_to_discord(): void
    {
        config(['services.discord.webhook_log_url' => 'https://discord.test/webhook']);

        $this->seedMapping();
        Http::fake([
            '*/price-list' => Http::response(['data' => [$this->prepaidItem(['price' => 11000])]]),
            'discord.test/*' => Http::response([]),
        ]);

        $this->artisan('digiflazz:sync-products --type=prepaid')->assertExitCode(0);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'discord.test'));
    }

    public function test_command_fails_when_digiflazz_is_unreachable(): void
    {
        Http::fake(['*/price-list' => Http::response('server error', 500)]);

        $this->artisan('digiflazz:check-prices --type=prepaid')->assertExitCode(1);
    }
}
