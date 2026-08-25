<?php

namespace Tests\Feature\Product;

use App\Actions\Uxiotopup\CheckUxiotopupPricesAction;
use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Support\Storefront\Catalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Publish and Unpublish from the Main Products list.
 *
 * The list used to offer "Activate", which wrote `products.status` and nothing
 * else. `Catalog::sellableProducts()` also needs an active supplier mapping, so
 * Activate produced products the admin was told were live while the storefront
 * could not see them. One verb now moves both halves, from either screen.
 */
class PublishProductTest extends TestCase
{
    use RefreshDatabase;

    private Supplier $uxiotopup;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
        $this->uxiotopup = Supplier::factory()->create(['name' => 'Uxiotopup']);
        Cache::flush();
    }

    private function product(array $overrides = []): Product
    {
        return Product::factory()->create([
            'category_id' => Category::factory()->create(['status' => true])->id,
            'code' => 'ML5',
            'status' => false,
            'published_at' => null,
            'price_modal' => 10000,
            'price_member' => 12000,
            'price_vip' => 11500,
            'price_reseller' => 11000,
            'price_agent' => 10500,
            ...$overrides,
        ]);
    }

    private function mappingFor(Product $product, array $overrides = []): SupplierProduct
    {
        return SupplierProduct::factory()->for($product)->for($this->uxiotopup)->create([
            'buyer_sku_code' => 'ML5',
            'price' => 10000,
            'is_active' => false,
            'buyer_product_status' => true,
            ...$overrides,
        ]);
    }

    private function publish(Product $product, bool $published = true)
    {
        return $this->postJson('/api/v1/products/bulk/publish', [
            'ids' => [$product->id],
            'published' => $published,
        ]);
    }

    public function test_publishing_moves_both_halves_and_makes_the_product_sellable(): void
    {
        $product = $this->product();
        $mapping = $this->mappingFor($product);

        $this->publish($product)->assertOk()->assertJsonPath('data.updated', 1);

        $product->refresh();
        $this->assertTrue((bool) $product->status);
        $this->assertTrue((bool) $mapping->fresh()->is_active);
        $this->assertNotNull($product->published_at);
        $this->assertSame(1, Catalog::sellableProducts(Product::query()->whereKey($product->id))->count());
        $this->assertSame(Product::STATE_PUBLISHED, $product->fresh()->load('supplierProducts')->publishState());
    }

    public function test_unpublishing_moves_both_halves_back(): void
    {
        $product = $this->product();
        $mapping = $this->mappingFor($product);
        $this->publish($product)->assertOk();

        $this->publish($product, false)->assertOk()->assertJsonPath('data.updated', 1);

        $product->refresh();
        $this->assertFalse((bool) $product->status);
        $this->assertFalse((bool) $mapping->fresh()->is_active);
        $this->assertSame(0, Catalog::sellableProducts(Product::query()->whereKey($product->id))->count());
        // published_at survives: it is what separates a draft from a product
        // that was taken down.
        $this->assertNotNull($product->published_at);
        $this->assertSame(Product::STATE_UNPUBLISHED, $product->load('supplierProducts')->publishState());
    }

    /**
     * The most expensive regression available here. `sync_deactivated_at` is
     * provenance: the 5-minute checker only re-activates what IT turned off. If
     * Unpublish left a stamp behind, the very next sync would put the product
     * back on sale by itself — money changing hands on a decision the admin had
     * already reversed.
     */
    public function test_the_five_minute_sync_never_republishes_an_unpublished_product(): void
    {
        $product = $this->product();
        // A mapping the checker itself had switched off at some point.
        $mapping = $this->mappingFor($product, ['sync_deactivated_at' => now()->subDay()]);
        $this->publish($product)->assertOk();
        $this->publish($product, false)->assertOk();

        $this->assertNull($mapping->fresh()->sync_deactivated_at, 'Unpublish must clear the checker stamp.');

        Http::fake(['*/service' => Http::response([
            'status' => true,
            'msg' => 'ok',
            'data' => [[
                'product_name' => 'Mobile Legends 5 Diamond',
                'category' => 'Games',
                'brand' => 'MOBILE LEGENDS',
                'type' => 'Umum',
                'seller_name' => 'Uxiotopup',
                'price' => 10000,
                'harga' => 10000,
                'buyer_sku_code' => 'ML5',
                'id' => 'ML5',
                'nama_layanan' => 'Mobile Legends 5 Diamond',
                'kategori' => 'Games',
                'status' => 'aktif',
                'buyer_product_status' => true,
                'seller_product_status' => true,
                'unlimited_stock' => true,
                'stock' => 0,
                'multi' => true,
                'start_cut_off' => '23:40',
                'end_cut_off' => '00:40',
                'desc' => '',
            ]],
        ])]);

        app(CheckUxiotopupPricesAction::class)->execute();

        $this->assertFalse((bool) $mapping->fresh()->is_active, 'The checker must not undo an admin decision.');
        $this->assertFalse((bool) $product->fresh()->status);
        $this->assertSame(0, Catalog::sellableProducts(Product::query()->whereKey($product->id))->count());
    }

    public function test_a_product_with_no_supplier_cannot_be_published(): void
    {
        $product = $this->product();

        $this->publish($product)
            ->assertOk()
            ->assertJsonPath('data.updated', 0)
            ->assertJsonPath('data.skipped.0.reason', 'Produk belum punya mapping supplier.');

        $this->assertFalse((bool) $product->fresh()->status);
    }

    public function test_a_sku_the_provider_switched_off_cannot_be_published(): void
    {
        $product = $this->product();
        $this->mappingFor($product, ['buyer_product_status' => false]);

        $this->publish($product)
            ->assertOk()
            ->assertJsonPath('data.updated', 0)
            ->assertJsonPath('data.skipped.0.reason', 'SKU sedang nonaktif di provider.');
    }

    public function test_the_list_reports_the_publish_state_and_why_it_is_blocked(): void
    {
        $product = $this->product();
        $this->mappingFor($product, ['buyer_product_status' => false]);

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('data.data.0.publish_state', Product::STATE_DRAFT)
            ->assertJsonPath('data.data.0.can_publish', false)
            ->assertJsonPath('data.data.0.publish_blocked_reason', 'SKU sedang nonaktif di provider.');
    }

    public function test_the_publish_state_filter_agrees_with_the_resource(): void
    {
        $draft = $this->product();
        $this->mappingFor($draft);

        $live = $this->product(['code' => 'ML10']);
        $this->mappingFor($live, ['buyer_sku_code' => 'ML10']);
        $this->publish($live)->assertOk();

        $this->getJson('/api/v1/products?publish_state=published')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $live->id);

        $this->getJson('/api/v1/products?publish_state=draft')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $draft->id);
    }
}
