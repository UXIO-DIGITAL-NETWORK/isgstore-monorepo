<?php

namespace Tests\Feature\Uxiolabs;

use App\Actions\Uxiolabs\CheckUxiolabsPricesAction;
use App\Enums\PriceChangeLogStatus;
use App\Models\PricingRule;
use App\Models\Product;
use App\Models\ProductPlanPrice;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Services\PricingService;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CheckUxiolabsPricesTest extends TestCase
{
    use RefreshDatabase;

    private Supplier $uxiolabs;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.uxiolabs.api_key' => 'test-api-key']);

        $this->uxiolabs = Supplier::factory()->create(['name' => 'Uxiolabs']);
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

    /** A live, priced mapping — the default subject of these tests. */
    private function seedMapping(int $cost = 10000, array $productOverrides = []): SupplierProduct
    {
        $product = Product::factory()->create(array_merge([
            'code' => 'ML5',
            'price_member' => 12000,
            'price_vip' => 11500,
            'price_reseller' => 11000,
            'price_agent' => 10500,
        ], $productOverrides));

        return SupplierProduct::factory()->for($product)->for($this->uxiolabs)->create([
            'buyer_sku_code' => 'ML5',
            'price' => $cost,
            'is_active' => true,
        ]);
    }

    public function test_unknown_service_creates_nothing_and_is_counted(): void
    {
        $this->fakePriceList([$this->serviceItem(['id' => 'BRAND_NEW'])]);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertSame(1, $report->unknownCount);
        $this->assertSame(['BRAND_NEW'], $report->unknownSkusSample);
        $this->assertDatabaseCount('products', 0);
        $this->assertDatabaseCount('supplier_products', 0);
        $this->assertDatabaseCount('price_change_logs', 0);
    }

    public function test_cost_rise_reprices_all_four_tiers_and_logs_applied(): void
    {
        $mapping = $this->seedMapping(10000);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertSame(1, $report->priceChangedCount);
        $this->assertSame(1, $report->repricedCount);

        // Cost is factual — updated automatically.
        $this->assertDatabaseHas('supplier_products', ['buyer_sku_code' => 'ML5', 'price' => 12000]);

        // All four tiers now follow the margin rules, and price_modal follows cost.
        // Compare against an independent PricingService run so this asserts the
        // wiring, not a hand-computed number vulnerable to float rounding.
        $product = $mapping->product->fresh();
        $expected = $this->expectedPrices($product, 12000);
        $this->assertSame($expected['price_member'], (int) $product->price_member);
        $this->assertSame($expected['price_vip'], (int) $product->price_vip);
        $this->assertSame($expected['price_reseller'], (int) $product->price_reseller);
        $this->assertSame($expected['price_agent'], (int) $product->price_agent);
        $this->assertSame(12000, (int) $product->price_modal);
        // The tiers genuinely moved up from the 10000-cost seed.
        $this->assertGreaterThan(12000, (int) $product->price_member);

        $this->assertDatabaseHas('price_change_logs', [
            'supplier_product_id' => $mapping->id,
            'buyer_sku_code' => 'ML5',
            'status' => PriceChangeLogStatus::APPLIED->value,
            'old_cost' => 10000,
            'new_cost' => 12000,
            'old_price_member' => 12000,
            'new_price_member' => $expected['price_member'],
        ]);
    }

    /** The same computation the checker delegates to — used to avoid float-artifact literals. */
    private function expectedPrices(Product $product, int $cost, array $overrides = []): array
    {
        return app(PricingService::class)->computePrices(
            $cost,
            $product->category_id,
            $overrides,
            $product->price_min,
            $product->price_max,
        );
    }

    /**
     * A repriced figure has to land where customers are charged from.
     *
     * The checker used to move `products.price_member` and leave
     * `product_plan_prices` alone, so a cost rise was logged as applied — "Harga
     * jual diperbarui otomatis" — while `PlanPrice` kept quoting the old price.
     * The drift it left behind is what failed the deploy's verify gate.
     */
    public function test_a_cost_rise_writes_the_plan_row_customers_are_billed_from(): void
    {
        $mapping = $this->seedMapping(10000);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        app(CheckUxiolabsPricesAction::class)->execute();

        $product = $mapping->product->fresh();

        // ceil(12000 × 1.2) — the same figure the change log reports.
        $this->assertSame(14400, (int) $product->price_member);
        $this->assertSame(14400, (int) ProductPlanPrice::where('product_id', $product->id)
            ->where('membership_plan_id', DefaultPlan::id())->value('price'));

        // And the gate that failed in production has nothing left to complain about.
        $this->artisan('pricing:verify')->assertSuccessful();
    }

    public function test_mapping_margin_override_wins_over_the_rules(): void
    {
        $mapping = $this->seedMapping(10000);
        $mapping->update(['margin_member' => 50]); // 50% override for member only

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        app(CheckUxiolabsPricesAction::class)->execute();

        $product = $mapping->product->fresh();
        $this->assertSame(18000, (int) $product->price_member); // 12000 * 1.5 (override)
        // No plan grants VIP in this database, so the legacy column mirrors the
        // default tier rather than inventing a price for a tier nobody sells.
        $this->assertSame(18000, (int) $product->price_vip);
    }

    public function test_price_max_clamps_the_repriced_values(): void
    {
        $mapping = $this->seedMapping(10000, ['price_max' => 13000]);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertSame(1, $report->repricedCount);
        $product = $mapping->product->fresh();
        // Member would exceed 13000 → clamped to it; agent stays under the ceiling.
        $this->assertSame(13000, (int) $product->price_member);
        $this->assertSame($this->expectedPrices($product, 12000)['price_agent'], (int) $product->price_agent);
    }

    public function test_locked_product_is_not_repriced_but_is_logged_locked(): void
    {
        $mapping = $this->seedMapping(10000, ['is_price_locked' => true, 'price_member' => 12000]);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertSame(1, $report->lockedCount);
        $this->assertSame(0, $report->repricedCount);

        // Cost still updates; the frozen selling price does not.
        $this->assertDatabaseHas('supplier_products', ['buyer_sku_code' => 'ML5', 'price' => 12000]);
        $this->assertSame(12000, (int) $mapping->product->fresh()->price_member);

        $this->assertDatabaseHas('price_change_logs', [
            'supplier_product_id' => $mapping->id,
            'status' => PriceChangeLogStatus::LOCKED->value,
            'old_cost' => 10000,
            'new_cost' => 12000,
            'new_price_member' => null,
        ]);
    }

    public function test_a_sku_deactivated_at_the_provider_is_logged_as_needs_attention(): void
    {
        $mapping = $this->seedMapping();

        $this->fakePriceList([$this->serviceItem(['status' => 'nonaktif'])]);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertSame(1, $report->deactivatedLoggedCount);
        $this->assertFalse((bool) $mapping->fresh()->is_active);
        $this->assertDatabaseHas('price_change_logs', [
            'supplier_product_id' => $mapping->id,
            'status' => PriceChangeLogStatus::DEACTIVATED->value,
        ]);
    }

    public function test_a_clamp_that_forces_price_below_cost_logs_negative_margin(): void
    {
        // price_max below the new cost means even the clamped price is under cost.
        $mapping = $this->seedMapping(10000, ['price_max' => 11000]);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertSame(1, $report->negativeMarginCount);
        $this->assertSame(0, $report->repricedCount);

        $product = $mapping->product->fresh();
        $this->assertSame(11000, (int) $product->price_member); // still applied (clamped)
        $this->assertLessThan(12000, (int) $product->price_member);

        $this->assertDatabaseHas('price_change_logs', [
            'supplier_product_id' => $mapping->id,
            'status' => PriceChangeLogStatus::NEGATIVE_MARGIN->value,
        ]);
    }

    public function test_a_pooled_row_is_never_repriced_or_logged(): void
    {
        $mapping = SupplierProduct::factory()->for($this->uxiolabs)->create([
            'product_id' => null,
            'buyer_sku_code' => 'ML5',
            'price' => 10000,
            'is_active' => true,
        ]);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        app(CheckUxiolabsPricesAction::class)->execute();

        // Cost still updates; nothing to reprice or log.
        $this->assertSame(12000, (int) $mapping->fresh()->price);
        $this->assertDatabaseCount('price_change_logs', 0);
    }

    public function test_an_inactive_mapped_product_is_not_repriced(): void
    {
        $product = Product::factory()->create(['code' => 'ML5', 'price_member' => 12000]);
        $mapping = SupplierProduct::factory()->for($product)->for($this->uxiolabs)->create([
            'buyer_sku_code' => 'ML5',
            'price' => 10000,
            'is_active' => false,
            'sync_deactivated_at' => null, // admin turned it off, not the checker
        ]);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertSame(0, $report->repricedCount);
        $this->assertDatabaseCount('price_change_logs', 0);
        $this->assertSame(12000, (int) $mapping->product->fresh()->price_member); // untouched
    }

    public function test_unchanged_cost_writes_no_log(): void
    {
        $this->seedMapping(10000);

        $this->fakePriceList([$this->serviceItem(['harga' => 10000])]);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertSame(0, $report->priceChangedCount);
        $this->assertDatabaseCount('price_change_logs', 0);
    }

    public function test_a_cost_revert_creates_a_second_applied_log_not_a_dedupe(): void
    {
        $mapping = $this->seedMapping(10000);

        Http::fake([
            '*/service' => Http::sequence()
                ->push(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem(['harga' => 12000])]])
                ->push(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem(['harga' => 10000])]]),
        ]);

        app(CheckUxiolabsPricesAction::class)->execute();
        app(CheckUxiolabsPricesAction::class)->execute();

        // Append-only: two movements, two rows.
        $this->assertDatabaseCount('price_change_logs', 2);
        // Prices are back to the 10000-derived values.
        $this->assertSame(12000, (int) $mapping->product->fresh()->price_member);
    }

    public function test_only_the_uxiolabs_suppliers_mappings_are_touched(): void
    {
        $other = Supplier::factory()->create(['name' => 'Other']);
        $otherProduct = Product::factory()->create(['code' => 'OTHER']);
        $otherMapping = SupplierProduct::factory()->for($otherProduct)->for($other)->create([
            'buyer_sku_code' => 'ML5',
            'price' => 10000,
            'is_active' => true,
        ]);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertSame(10000, (int) $otherMapping->fresh()->price);
        $this->assertDatabaseCount('price_change_logs', 0);
    }

    public function test_configured_price_tier_is_used_as_cost(): void
    {
        config(['services.uxiolabs.price_tier' => 'harga_gold']);

        $this->seedMapping(10000);
        $this->fakePriceList([$this->serviceItem(['harga' => 10000, 'harga_gold' => 9500])]);

        app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertDatabaseHas('supplier_products', ['buyer_sku_code' => 'ML5', 'price' => 9500]);
    }

    public function test_nonaktif_service_is_deactivated_and_reactivated_only_by_checker(): void
    {
        $mapping = $this->seedMapping();

        Http::fake([
            '*/service' => Http::sequence()
                ->push(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem(['status' => 'nonaktif'])]])
                ->push(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem()]]),
        ]);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

        $mapping->refresh();
        $this->assertSame(['ML5'], $report->deactivated);
        $this->assertFalse((bool) $mapping->is_active);
        $this->assertNotNull($mapping->sync_deactivated_at);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

        $mapping->refresh();
        $this->assertSame(['ML5'], $report->reactivated);
        $this->assertTrue((bool) $mapping->is_active);
        $this->assertNull($mapping->sync_deactivated_at);
    }

    public function test_manually_deactivated_mapping_is_never_reactivated(): void
    {
        $product = Product::factory()->create(['code' => 'ML5']);
        $mapping = SupplierProduct::factory()->for($product)->for($this->uxiolabs)->create([
            'buyer_sku_code' => 'ML5',
            'price' => 10000,
            'is_active' => false,
            'sync_deactivated_at' => null, // admin turned it off, not the checker
        ]);

        $this->fakePriceList([$this->serviceItem()]);
        app(CheckUxiolabsPricesAction::class)->execute();

        $this->assertFalse((bool) $mapping->fresh()->is_active);
    }

    public function test_a_locked_product_with_rising_cost_surfaces_in_the_negative_margin_scan(): void
    {
        // Locked → not repriced, so a rising cost leaves member below cost, which
        // the cross-check scan still surfaces for the Discord report.
        $this->seedMapping(10000, ['is_price_locked' => true, 'price_member' => 12000]);

        $this->fakePriceList([$this->serviceItem(['harga' => 15000])]);

        $report = app(CheckUxiolabsPricesAction::class)->execute();

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

        app(CheckUxiolabsPricesAction::class)->execute();
    }

    public function test_check_prices_command_runs_quietly(): void
    {
        $this->fakePriceList([$this->serviceItem()]);

        $this->artisan('uxiolabs:check-prices')->assertExitCode(0);
    }

    public function test_sync_products_command_runs_and_reports_to_discord(): void
    {
        config(['services.discord.webhook_log_url' => 'https://discord.test/webhook']);

        $this->seedMapping();
        Http::fake([
            '*/service' => Http::response(['status' => true, 'msg' => 'ok', 'data' => [$this->serviceItem(['harga' => 11000])]]),
            'discord.test/*' => Http::response([]),
        ]);

        $this->artisan('uxiolabs:sync-products')->assertExitCode(0);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'discord.test'));
    }

    public function test_command_fails_when_uxiolabs_is_unreachable(): void
    {
        Http::fake(['*/service' => Http::response('server error', 500)]);

        $this->artisan('uxiolabs:check-prices')->assertExitCode(1);
    }

    public function test_pricing_rules_drive_the_repriced_values(): void
    {
        PricingRule::factory()->create(['category_id' => null, 'role' => 'member', 'markup_percent' => 30, 'markup_flat' => 0]);
        $mapping = $this->seedMapping(10000);

        $this->fakePriceList([$this->serviceItem(['harga' => 12000])]);

        app(CheckUxiolabsPricesAction::class)->execute();

        $product = $mapping->product->fresh();
        // The 30% rule drives it, above the 20% built-in default (which would be 14400).
        $this->assertSame($this->expectedPrices($product, 12000)['price_member'], (int) $product->price_member);
        $this->assertGreaterThan(15000, (int) $product->price_member);
    }
}
