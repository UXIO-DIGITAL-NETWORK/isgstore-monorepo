<?php

namespace Tests\Feature\Digiflazz;

use App\Actions\Digiflazz\SyncDigiflazzProductsAction;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SyncDigiflazzProductsTest extends TestCase
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

    public function test_new_sku_creates_inactive_product_with_computed_prices(): void
    {
        Category::factory()->create(['code' => 'mlbb']);
        $this->fakePriceList([$this->prepaidItem()]);

        $report = app(SyncDigiflazzProductsAction::class)->execute('prepaid');

        $this->assertCount(1, $report->newProducts);

        $product = Product::where('code', 'ml5')->firstOrFail();
        $this->assertFalse((bool) $product->status, 'auto-created products must be hidden until reviewed');
        $this->assertTrue((bool) $product->auto_price);
        $this->assertSame(10000, (int) $product->price_modal);
        $this->assertSame(12000, (int) $product->price_member); // default 20% markup

        $this->assertDatabaseHas('supplier_products', [
            'product_id' => $product->id,
            'supplier_id' => $this->digiflazz->id,
            'buyer_sku_code' => 'ml5',
            'price' => 10000,
            'is_active' => true,
        ]);
    }

    public function test_unmapped_brand_falls_back_to_uncategorized_and_is_reported(): void
    {
        $this->fakePriceList([$this->prepaidItem(['brand' => 'UNKNOWN GAME', 'buyer_sku_code' => 'ug1'])]);

        $report = app(SyncDigiflazzProductsAction::class)->execute('prepaid');

        $this->assertSame(['UNKNOWN GAME'], $report->unmappedBrands);
        $this->assertDatabaseHas('categories', ['code' => 'uncategorized']);
        $product = Product::where('code', 'ug1')->firstOrFail();
        $this->assertSame('uncategorized', $product->category->code);
    }

    public function test_new_sku_matching_existing_product_code_links_instead_of_duplicating(): void
    {
        $product = Product::factory()->create(['code' => 'ml5']);
        $this->fakePriceList([$this->prepaidItem()]);

        $report = app(SyncDigiflazzProductsAction::class)->execute('prepaid');

        $this->assertCount(0, $report->newProducts);
        $this->assertDatabaseCount('products', 1);
        $this->assertDatabaseHas('supplier_products', [
            'product_id' => $product->id,
            'buyer_sku_code' => 'ml5',
        ]);
    }

    public function test_price_change_updates_cost_and_recalculates_auto_priced_product(): void
    {
        $product = Product::factory()->create(['code' => 'ml5', 'auto_price' => true]);
        SupplierProduct::factory()->for($product)->for($this->digiflazz)->create([
            'buyer_sku_code' => 'ml5',
            'price' => 10000,
        ]);

        $this->fakePriceList([$this->prepaidItem(['price' => 11000])]);

        $report = app(SyncDigiflazzProductsAction::class)->execute('prepaid');

        $this->assertSame(1, $report->priceChangedCount);
        $this->assertDatabaseHas('supplier_products', ['buyer_sku_code' => 'ml5', 'price' => 11000]);

        $product->refresh();
        $this->assertSame(11000, (int) $product->price_modal);
        $this->assertSame(13200, (int) $product->price_member); // 11000 * 1.2
    }

    public function test_price_change_leaves_manually_priced_product_untouched(): void
    {
        $product = Product::factory()->create([
            'code' => 'ml5',
            'auto_price' => false,
            'price_member' => 99999,
        ]);
        SupplierProduct::factory()->for($product)->for($this->digiflazz)->create([
            'buyer_sku_code' => 'ml5',
            'price' => 10000,
        ]);

        $this->fakePriceList([$this->prepaidItem(['price' => 11000])]);

        app(SyncDigiflazzProductsAction::class)->execute('prepaid');

        $product->refresh();
        $this->assertSame(99999, (int) $product->price_member);
        // Supplier cost still tracks reality.
        $this->assertDatabaseHas('supplier_products', ['buyer_sku_code' => 'ml5', 'price' => 11000]);
    }

    public function test_unavailable_sku_is_deactivated_and_reactivated_only_by_sync(): void
    {
        $product = Product::factory()->create(['code' => 'ml5']);
        $mapping = SupplierProduct::factory()->for($product)->for($this->digiflazz)->create([
            'buyer_sku_code' => 'ml5',
            'price' => 10000,
            'is_active' => true,
        ]);

        // Run 1: Digiflazz reports the SKU offline. Run 2: back online.
        Http::fake([
            '*/price-list' => Http::sequence()
                ->push(['data' => [$this->prepaidItem(['seller_product_status' => false])]])
                ->push(['data' => [$this->prepaidItem()]]),
        ]);

        $report = app(SyncDigiflazzProductsAction::class)->execute('prepaid');

        $mapping->refresh();
        $this->assertSame(['ml5'], $report->deactivated);
        $this->assertFalse((bool) $mapping->is_active);
        $this->assertNotNull($mapping->sync_deactivated_at);

        // Back online → the sync restores what it turned off.
        $report = app(SyncDigiflazzProductsAction::class)->execute('prepaid');

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
            'sync_deactivated_at' => null, // admin turned it off, not the sync
        ]);

        $this->fakePriceList([$this->prepaidItem()]);
        app(SyncDigiflazzProductsAction::class)->execute('prepaid');

        $this->assertFalse((bool) $mapping->fresh()->is_active);
    }

    public function test_pasca_sync_stores_admin_fee_and_commission(): void
    {
        $product = Product::factory()->create(['code' => 'pln']);
        SupplierProduct::factory()->for($product)->for($this->digiflazz)->create([
            'buyer_sku_code' => 'pln',
            'price' => 0,
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

        app(SyncDigiflazzProductsAction::class)->execute('pasca');

        $this->assertDatabaseHas('supplier_products', [
            'buyer_sku_code' => 'pln',
            'price' => 2500,
            'admin_fee' => 2500,
            'commission' => 1200,
        ]);
    }

    public function test_negative_margin_products_are_reported(): void
    {
        $product = Product::factory()->create([
            'code' => 'ml5',
            'auto_price' => false,
            'price_member' => 12000,
        ]);
        SupplierProduct::factory()->for($product)->for($this->digiflazz)->create([
            'buyer_sku_code' => 'ml5',
            'price' => 10000,
            'is_active' => true,
        ]);

        $this->fakePriceList([$this->prepaidItem(['price' => 15000])]);

        $report = app(SyncDigiflazzProductsAction::class)->execute('prepaid');

        $this->assertCount(1, $report->negativeMargin);
        $this->assertSame('ml5', $report->negativeMargin[0]['sku']);
    }

    public function test_command_runs_and_reports_to_discord(): void
    {
        config(['services.discord.webhook_log_url' => 'https://discord.test/webhook']);

        Category::factory()->create(['code' => 'mlbb']);
        Http::fake([
            '*/price-list' => Http::response(['data' => [$this->prepaidItem()]]),
            'discord.test/*' => Http::response([]),
        ]);

        $this->artisan('digiflazz:sync-products --type=prepaid')->assertExitCode(0);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'discord.test'));
    }

    public function test_command_fails_when_digiflazz_is_unreachable(): void
    {
        Http::fake(['*/price-list' => Http::response('server error', 500)]);

        $this->artisan('digiflazz:sync-products --type=prepaid')->assertExitCode(1);
    }
}
