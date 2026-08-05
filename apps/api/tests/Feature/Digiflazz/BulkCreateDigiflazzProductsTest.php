<?php

namespace Tests\Feature\Digiflazz;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Services\DigiflazzService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BulkCreateDigiflazzProductsTest extends TestCase
{
    use RefreshDatabase;

    private Supplier $digiflazz;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.digiflazz.username' => 'testuser',
            'services.digiflazz.key' => 'testkey',
        ]);

        Cache::forget(DigiflazzService::PRICE_LIST_CACHE_KEY.'prepaid');

        $this->digiflazz = Supplier::factory()->create(['name' => 'Digiflazz']);
        $this->category = Category::factory()->create(['code' => 'pulsa']);

        $items = [
            $this->prepaidItem(['buyer_sku_code' => 'X100', 'product_name' => 'Xl 100.000', 'price' => 98000]),
            $this->prepaidItem(['buyer_sku_code' => 'S5', 'product_name' => 'Telkomsel 5.000', 'price' => 5100]),
        ];
        Http::fake(['*/price-list' => Http::response(['data' => $items])]);
    }

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    private function prepaidItem(array $overrides = []): array
    {
        return array_merge([
            'product_name' => 'Product',
            'category' => 'Pulsa',
            'brand' => 'XL',
            'price' => 10000,
            'buyer_sku_code' => 'sku',
            'buyer_product_status' => true,
            'seller_product_status' => true,
        ], $overrides);
    }

    public function test_endpoint_requires_authentication(): void
    {
        $this->postJson('/api/v1/digiflazz/products/bulk')->assertUnauthorized();
    }

    public function test_bulk_creates_products_with_auto_derived_prices(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/digiflazz/products/bulk', [
            'type' => 'prepaid',
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
            'supplier_id' => $this->digiflazz->id,
            'buyer_sku_code' => 'X100',
        ]);
    }

    public function test_bulk_skips_already_mapped_or_unknown_skus_without_aborting(): void
    {
        $this->actingAsAdmin();

        // X100 already mapped — should land in skipped, S5 still created.
        $existing = Product::factory()->create(['code' => 'X100']);
        SupplierProduct::factory()->for($existing)->for($this->digiflazz)->create(['buyer_sku_code' => 'X100']);

        $this->postJson('/api/v1/digiflazz/products/bulk', [
            'type' => 'prepaid',
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

        $this->postJson('/api/v1/digiflazz/products/bulk', [
            'type' => 'prepaid',
            'status' => true,
            'buyer_sku_codes' => [],
        ])->assertUnprocessable();
    }
}
