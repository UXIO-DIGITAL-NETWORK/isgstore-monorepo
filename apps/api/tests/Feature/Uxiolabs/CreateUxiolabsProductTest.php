<?php

namespace Tests\Feature\Uxiolabs;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CreateUxiolabsProductTest extends TestCase
{
    use RefreshDatabase;

    private Supplier $uxiolabs;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.uxiolabs.api_key' => 'test-api-key']);

        $this->uxiolabs = Supplier::factory()->create(['name' => 'Uxiolabs']);
        $this->category = Category::factory()->create(['code' => 'mlbb']);
    }

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
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

    public function test_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/uxiolabs/sku-preview?buyer_sku_code=ML5')->assertUnauthorized();
        $this->postJson('/api/v1/uxiolabs/products')->assertUnauthorized();
    }

    public function test_sku_preview_returns_item_with_suggested_prices(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->serviceItem()]);

        $this->getJson('/api/v1/uxiolabs/sku-preview?buyer_sku_code=ML5')
            ->assertOk()
            ->assertJsonPath('data.buyer_sku_code', 'ML5')
            ->assertJsonPath('data.name', 'Mobile Legends 5 Diamond')
            ->assertJsonPath('data.category', 'Mobile Legends')
            ->assertJsonPath('data.cost', 10000)
            ->assertJsonPath('data.available', true)
            ->assertJsonPath('data.already_mapped', false)
            ->assertJsonPath('data.suggested_prices.price_member', 12000); // built-in 20% markup
    }

    public function test_sku_preview_flags_already_mapped_service(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['code' => 'ML5']);
        SupplierProduct::factory()->for($product)->for($this->uxiolabs)->create(['buyer_sku_code' => 'ML5']);

        $this->fakePriceList([$this->serviceItem()]);

        $this->getJson('/api/v1/uxiolabs/sku-preview?buyer_sku_code=ML5')
            ->assertOk()
            ->assertJsonPath('data.already_mapped', true);
    }

    public function test_sku_preview_returns_404_for_unknown_service(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->serviceItem()]);

        $this->getJson('/api/v1/uxiolabs/sku-preview?buyer_sku_code=nope')
            ->assertNotFound();
    }

    public function test_store_creates_product_and_mapping_with_admin_prices(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->serviceItem()]);

        $this->postJson('/api/v1/uxiolabs/products', [
            'buyer_sku_code' => 'ML5',
            'category_id' => $this->category->id,
            'price_member' => 13000,
            'price_vip' => 12500,
            'price_reseller' => 12000,
            'price_agent' => 11500,
            'status' => true,
        ])->assertCreated();

        $product = Product::where('code', 'ML5')->firstOrFail();
        $this->assertSame('Mobile Legends 5 Diamond', $product->name); // from uxiolabs
        $this->assertSame(10000, (int) $product->price_modal);          // cost from uxiolabs
        $this->assertSame(13000, (int) $product->price_member);         // admin's price
        $this->assertTrue((bool) $product->status);

        $this->assertDatabaseHas('supplier_products', [
            'product_id' => $product->id,
            'supplier_id' => $this->uxiolabs->id,
            'buyer_sku_code' => 'ML5',
            'price' => 10000,
            'is_active' => true,
        ]);
    }

    public function test_store_uses_configured_price_tier_as_cost(): void
    {
        config(['services.uxiolabs.price_tier' => 'harga_pro']);

        $this->actingAsAdmin();
        $this->fakePriceList([$this->serviceItem()]);

        $this->postJson('/api/v1/uxiolabs/products', [
            'buyer_sku_code' => 'ML5',
            'category_id' => $this->category->id,
            'price_member' => 13000,
            'price_vip' => 12500,
            'price_reseller' => 12000,
            'price_agent' => 11500,
            'status' => true,
        ])->assertCreated();

        $this->assertSame(9700, (int) Product::where('code', 'ML5')->firstOrFail()->price_modal);
    }

    public function test_store_rejects_service_not_in_price_list(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->serviceItem()]);

        $this->postJson('/api/v1/uxiolabs/products', [
            'buyer_sku_code' => 'unknown-service',
            'category_id' => $this->category->id,
            'price_member' => 13000,
            'price_vip' => 12500,
            'price_reseller' => 12000,
            'price_agent' => 11500,
            'status' => true,
        ])->assertUnprocessable();

        $this->assertDatabaseCount('products', 0);
    }

    public function test_store_rejects_already_mapped_service(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['code' => 'existing']);
        SupplierProduct::factory()->for($product)->for($this->uxiolabs)->create(['buyer_sku_code' => 'ML5']);

        $this->fakePriceList([$this->serviceItem()]);

        $this->postJson('/api/v1/uxiolabs/products', [
            'buyer_sku_code' => 'ML5',
            'category_id' => $this->category->id,
            'code' => 'new-code',
            'price_member' => 13000,
            'price_vip' => 12500,
            'price_reseller' => 12000,
            'price_agent' => 11500,
            'status' => false,
        ])->assertUnprocessable();
    }

    public function test_store_rejects_taken_product_code(): void
    {
        $this->actingAsAdmin();
        Product::factory()->create(['code' => 'ML5']); // code collides with default (= service id)

        $this->fakePriceList([$this->serviceItem()]);

        $this->postJson('/api/v1/uxiolabs/products', [
            'buyer_sku_code' => 'ML5',
            'category_id' => $this->category->id,
            'price_member' => 13000,
            'price_vip' => 12500,
            'price_reseller' => 12000,
            'price_agent' => 11500,
            'status' => false,
        ])->assertUnprocessable();
    }

    public function test_store_rejects_nonaktif_cost_of_zero(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->serviceItem(['harga' => 0])]);

        $this->postJson('/api/v1/uxiolabs/products', [
            'buyer_sku_code' => 'ML5',
            'category_id' => $this->category->id,
            'price_member' => 13000,
            'price_vip' => 12500,
            'price_reseller' => 12000,
            'price_agent' => 11500,
            'status' => true,
        ])->assertUnprocessable();
    }
}
