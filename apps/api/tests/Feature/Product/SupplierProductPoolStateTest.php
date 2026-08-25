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
 * `pool_state` is what the admin badges and the row menu's Publish item read, so
 * it has to mean the same thing as `Catalog::sellableProducts()`. When it did
 * not, a promoted row whose product had been flipped active from the Main
 * Products list reported PUBLISHED, lost its Publish action, and never reached
 * the storefront.
 */
class SupplierProductPoolStateTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    private function promoted(bool $productActive, bool $mappingActive): SupplierProduct
    {
        $product = Product::factory()->create([
            'category_id' => Category::factory()->create(['status' => true])->id,
            'status' => $productActive,
            'price_modal' => 10000,
            'price_member' => 12000,
            'price_vip' => 11500,
            'price_reseller' => 11000,
            'price_agent' => 10500,
        ]);

        return SupplierProduct::factory()->create([
            'product_id' => $product->id,
            'supplier_id' => Supplier::factory()->create()->id,
            'is_active' => $mappingActive,
            'price' => 10000,
        ]);
    }

    public function test_a_freshly_promoted_row_is_a_draft(): void
    {
        $this->assertSame(SupplierProduct::STATE_DRAFT, $this->promoted(false, false)->poolState());
    }

    public function test_both_switches_on_is_published(): void
    {
        $this->assertSame(SupplierProduct::STATE_PUBLISHED, $this->promoted(true, true)->poolState());
    }

    /**
     * The regression: an active product whose mapping is still off is NOT live —
     * checkout would reject it and the storefront never lists it.
     */
    public function test_active_product_with_an_inactive_mapping_stays_a_draft(): void
    {
        $row = $this->promoted(true, false);

        $this->assertSame(SupplierProduct::STATE_DRAFT, $row->poolState());
        $this->assertSame(0, Catalog::sellableProducts(Product::query()->whereKey($row->product_id))->count());
    }

    public function test_the_list_filter_agrees_with_the_badge(): void
    {
        $this->actingAsAdmin();
        $stranded = $this->promoted(true, false);
        $live = $this->promoted(true, true);

        $draftIds = collect($this->getJson('/api/v1/supplier-products?pool_state=draft')
            ->assertOk()->json('data.data'))->pluck('id');
        $this->assertTrue($draftIds->contains($stranded->id));
        $this->assertFalse($draftIds->contains($live->id));

        $publishedIds = collect($this->getJson('/api/v1/supplier-products?pool_state=published')
            ->assertOk()->json('data.data'))->pluck('id');
        $this->assertTrue($publishedIds->contains($live->id));
        $this->assertFalse($publishedIds->contains($stranded->id));
    }

    /** Publishing a stranded row is what un-strands it — both halves, one act. */
    public function test_publishing_a_stranded_row_makes_it_sellable(): void
    {
        $this->actingAsAdmin();
        $row = $this->promoted(true, false);

        $this->postJson("/api/v1/supplier-products/{$row->id}/publish")->assertOk();

        $this->assertSame(SupplierProduct::STATE_PUBLISHED, $row->fresh()->poolState());
        $this->assertSame(1, Catalog::sellableProducts(Product::query()->whereKey($row->product_id))->count());
    }
}
