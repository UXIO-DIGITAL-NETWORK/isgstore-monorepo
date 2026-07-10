<?php

namespace Tests\Feature\Digiflazz;

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

class CreateDigiflazzProductTest extends TestCase
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

        $this->digiflazz = Supplier::factory()->create(['name' => 'Digiflazz']);
        $this->category = Category::factory()->create(['code' => 'mlbb']);
    }

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
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
            'price' => 10000,
            'buyer_sku_code' => 'ml5',
            'buyer_product_status' => true,
            'seller_product_status' => true,
        ], $overrides);
    }

    public function test_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/digiflazz/sku-preview?buyer_sku_code=ml5')->assertUnauthorized();
        $this->postJson('/api/v1/digiflazz/products')->assertUnauthorized();
    }

    public function test_sku_preview_returns_item_with_suggested_prices(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->prepaidItem()]);

        $this->getJson('/api/v1/digiflazz/sku-preview?buyer_sku_code=ml5&type=prepaid')
            ->assertOk()
            ->assertJsonPath('data.buyer_sku_code', 'ml5')
            ->assertJsonPath('data.name', 'Mobile Legends 5 Diamond')
            ->assertJsonPath('data.cost', 10000)
            ->assertJsonPath('data.available', true)
            ->assertJsonPath('data.already_mapped', false)
            ->assertJsonPath('data.suggested_prices.price_member', 12000); // built-in 20% markup
    }

    public function test_sku_preview_flags_already_mapped_sku(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['code' => 'ml5']);
        SupplierProduct::factory()->for($product)->for($this->digiflazz)->create(['buyer_sku_code' => 'ml5']);

        $this->fakePriceList([$this->prepaidItem()]);

        $this->getJson('/api/v1/digiflazz/sku-preview?buyer_sku_code=ml5')
            ->assertOk()
            ->assertJsonPath('data.already_mapped', true);
    }

    public function test_sku_preview_returns_404_for_unknown_sku(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->prepaidItem()]);

        $this->getJson('/api/v1/digiflazz/sku-preview?buyer_sku_code=nope')
            ->assertNotFound();
    }

    public function test_store_creates_product_and_mapping_with_admin_prices(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->prepaidItem()]);

        $this->postJson('/api/v1/digiflazz/products', [
            'buyer_sku_code' => 'ml5',
            'type' => 'prepaid',
            'category_id' => $this->category->id,
            'price_member' => 13000,
            'price_vip' => 12500,
            'price_reseller' => 12000,
            'price_agent' => 11500,
            'status' => true,
        ])->assertCreated();

        $product = Product::where('code', 'ml5')->firstOrFail();
        $this->assertSame('Mobile Legends 5 Diamond', $product->name); // from Digiflazz
        $this->assertSame(10000, (int) $product->price_modal);          // cost from Digiflazz
        $this->assertSame(13000, (int) $product->price_member);         // admin's price
        $this->assertTrue((bool) $product->status);

        $this->assertDatabaseHas('supplier_products', [
            'product_id' => $product->id,
            'supplier_id' => $this->digiflazz->id,
            'buyer_sku_code' => 'ml5',
            'price' => 10000,
            'is_active' => true,
        ]);
    }

    public function test_store_rejects_sku_not_in_price_list(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([$this->prepaidItem()]);

        $this->postJson('/api/v1/digiflazz/products', [
            'buyer_sku_code' => 'unknown-sku',
            'type' => 'prepaid',
            'category_id' => $this->category->id,
            'price_member' => 13000,
            'price_vip' => 12500,
            'price_reseller' => 12000,
            'price_agent' => 11500,
            'status' => true,
        ])->assertUnprocessable();

        $this->assertDatabaseCount('products', 0);
    }

    public function test_store_rejects_already_mapped_sku(): void
    {
        $this->actingAsAdmin();
        $product = Product::factory()->create(['code' => 'existing']);
        SupplierProduct::factory()->for($product)->for($this->digiflazz)->create(['buyer_sku_code' => 'ml5']);

        $this->fakePriceList([$this->prepaidItem()]);

        $this->postJson('/api/v1/digiflazz/products', [
            'buyer_sku_code' => 'ml5',
            'type' => 'prepaid',
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
        Product::factory()->create(['code' => 'ml5']); // code collides with default (= sku)

        $this->fakePriceList([$this->prepaidItem()]);

        $this->postJson('/api/v1/digiflazz/products', [
            'buyer_sku_code' => 'ml5',
            'type' => 'prepaid',
            'category_id' => $this->category->id,
            'price_member' => 13000,
            'price_vip' => 12500,
            'price_reseller' => 12000,
            'price_agent' => 11500,
            'status' => false,
        ])->assertUnprocessable();
    }

    public function test_store_pasca_product_stores_admin_fee_and_commission(): void
    {
        $this->actingAsAdmin();
        $this->fakePriceList([[
            'product_name' => 'PLN Pascabayar',
            'brand' => 'PLN',
            'admin' => 2500,
            'commission' => 1200,
            'buyer_sku_code' => 'pln',
            'buyer_product_status' => true,
            'seller_product_status' => true,
        ]]);

        $this->postJson('/api/v1/digiflazz/products', [
            'buyer_sku_code' => 'pln',
            'type' => 'pasca',
            'category_id' => $this->category->id,
            'price_member' => 3000,
            'price_vip' => 2900,
            'price_reseller' => 2800,
            'price_agent' => 2700,
            'status' => true,
        ])->assertCreated();

        $this->assertDatabaseHas('supplier_products', [
            'buyer_sku_code' => 'pln',
            'price' => 2500,
            'admin_fee' => 2500,
            'commission' => 1200,
        ]);
    }
}
