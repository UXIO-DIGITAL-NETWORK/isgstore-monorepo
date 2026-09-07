<?php

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Support\Storefront\Catalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The onboarding shortcut: promote and publish without a round trip through the
 * Main Products list.
 *
 * Two steps across two screens is right when each SKU deserves a look, and
 * needless friction when fifty already-priced SKUs are going straight on sale.
 */
class PromoteAndPublishTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
        $this->category = Category::factory()->create(['status' => true]);
    }

    private function pooled(array $overrides = []): SupplierProduct
    {
        return SupplierProduct::factory()->create([
            'product_id' => null,
            'pool_category_id' => $this->category->id,
            'supplier_id' => Supplier::factory()->create()->id,
            'price' => 10000,
            'margin_member' => 20,
            'margin_set_at' => now(),
            'is_active' => false,
            'buyer_product_status' => true,
            ...$overrides,
        ]);
    }

    public function test_it_promotes_and_publishes_in_one_call(): void
    {
        $row = $this->pooled();

        $this->postJson('/api/v1/supplier-products/bulk/promote-publish', ['ids' => [$row->id]])
            ->assertOk()
            ->assertJsonPath('data.promoted', 1)
            ->assertJsonPath('data.published', 1);

        $row->refresh();
        $this->assertNotNull($row->product_id);
        $this->assertTrue((bool) $row->is_active);
        $this->assertSame(1, Catalog::sellableProducts(Product::query()->whereKey($row->product_id))->count());
        $this->assertSame(SupplierProduct::STATE_PUBLISHED, $row->poolState());
    }

    public function test_the_published_row_leaves_the_pool(): void
    {
        $row = $this->pooled();
        $this->postJson('/api/v1/supplier-products/bulk/promote-publish', ['ids' => [$row->id]])->assertOk();

        $ids = collect($this->getJson('/api/v1/supplier-products')->assertOk()->json('data.data'))->pluck('id');
        $this->assertFalse($ids->contains($row->id), 'A promoted SKU belongs to Main Products, not the pool.');
    }

    public function test_an_unpriced_sku_is_skipped_with_its_reason(): void
    {
        $priced = $this->pooled();
        $unpriced = $this->pooled(['margin_set_at' => null, 'margin_member' => null]);

        $this->postJson('/api/v1/supplier-products/bulk/promote-publish', ['ids' => [$priced->id, $unpriced->id]])
            ->assertOk()
            ->assertJsonPath('data.published', 1)
            ->assertJsonPath('data.skipped.0.id', $unpriced->id)
            ->assertJsonPath('data.skipped.0.reason', 'Set profit margin terlebih dahulu sebelum promote.');

        // One bad SKU must not cost the admin the good one.
        $this->assertNotNull($priced->fresh()->product_id);
        $this->assertNull($unpriced->fresh()->product_id);
    }

    /**
     * A row that promotes but cannot publish stays a draft rather than being
     * rolled back — the promotion was still correct, only the going-live part
     * was refused, and the admin can fix it from Main Products.
     */
    public function test_a_sku_off_at_the_provider_promotes_but_stays_a_draft(): void
    {
        $row = $this->pooled(['buyer_product_status' => false]);

        $this->postJson('/api/v1/supplier-products/bulk/promote-publish', ['ids' => [$row->id]])
            ->assertOk()
            ->assertJsonPath('data.promoted', 1)
            ->assertJsonPath('data.published', 0)
            ->assertJsonPath('data.skipped.0.reason', 'SKU sedang nonaktif di provider.');

        $row->refresh();
        $this->assertNotNull($row->product_id);
        $this->assertFalse((bool) $row->is_active);
        $this->assertSame(SupplierProduct::STATE_DRAFT, $row->poolState());
    }
}
