<?php

namespace Tests\Feature\Uxiotopup;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Services\UxiotopupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BulkCreateUxiotopupProductsTest extends TestCase
{
    use RefreshDatabase;

    private Supplier $uxiotopup;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.uxiotopup.api_key' => 'test-api-key']);

        Cache::forget(UxiotopupService::PRICE_LIST_CACHE_KEY);

        $this->uxiotopup = Supplier::factory()->create(['name' => 'Uxiotopup']);
        $this->category = Category::factory()->create(['code' => 'pulsa']);

        $items = [
            $this->serviceItem(['id' => 'X100', 'nama_layanan' => 'Xl 100.000', 'harga' => 98000]),
            $this->serviceItem(['id' => 'S5', 'nama_layanan' => 'Telkomsel 5.000', 'harga' => 5100]),
        ];
        Http::fake(['*/service' => Http::response(['status' => true, 'msg' => 'ok', 'data' => $items])]);
    }

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    private function serviceItem(array $overrides = []): array
    {
        return array_merge([
            'id' => 'SKU',
            'nama_layanan' => 'Product',
            'kategori' => 'Pulsa',
            'harga' => 10000,
            'harga_gold' => 9800,
            'harga_silver' => 9900,
            'harga_pro' => 9700,
            'status' => 'aktif',
        ], $overrides);
    }

    public function test_endpoint_requires_authentication(): void
    {
        $this->postJson('/api/v1/uxiotopup/products/bulk')->assertUnauthorized();
    }

    public function test_bulk_creates_products_with_auto_derived_prices(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/uxiotopup/products/bulk', [
            'category_id' => $this->category->id,
            'status' => true,
            'buyer_sku_codes' => ['X100', 'S5'],
        ])
            ->assertCreated()
            ->assertJsonPath('data.created', 2)
            ->assertJsonCount(0, 'data.skipped');

        $this->assertDatabaseCount('products', 2);

        // Prices auto-derived from PricingService (built-in 20% member markup).
        $product = Product::where('code', 'X100')->firstOrFail();
        $this->assertSame(98000, (int) $product->price_modal);
        $this->assertSame((int) ceil(98000 * 1.20), (int) $product->price_member);

        $this->assertDatabaseHas('supplier_products', [
            'supplier_id' => $this->uxiotopup->id,
            'buyer_sku_code' => 'X100',
        ]);
    }

    public function test_bulk_skips_already_mapped_or_unknown_services_without_aborting(): void
    {
        $this->actingAsAdmin();

        // X100 already mapped — should land in skipped, S5 still created.
        $existing = Product::factory()->create(['code' => 'X100']);
        SupplierProduct::factory()->for($existing)->for($this->uxiotopup)->create(['buyer_sku_code' => 'X100']);

        $this->postJson('/api/v1/uxiotopup/products/bulk', [
            'category_id' => $this->category->id,
            'status' => true,
            'buyer_sku_codes' => ['X100', 'S5', 'UNKNOWN'],
        ])
            ->assertCreated()
            ->assertJsonPath('data.created', 1)
            ->assertJsonCount(2, 'data.skipped');

        $this->assertNotNull(Product::where('code', 'S5')->first());
    }

    public function test_bulk_validates_required_fields(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/uxiotopup/products/bulk', [
            'status' => true,
            'buyer_sku_codes' => [],
        ])->assertUnprocessable();
    }
}
