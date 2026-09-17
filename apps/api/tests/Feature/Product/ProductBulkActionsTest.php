<?php

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPlanPrice;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductBulkActionsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function product(array $overrides = []): Product
    {
        return Product::factory()->create(array_merge([
            'category_id' => Category::factory()->create()->id,
            'price_modal' => 10000,
            'price_member' => 12000,
            'price_vip' => 11500,
            'price_reseller' => 11000,
            'price_agent' => 10500,
        ], $overrides));
    }

    public function test_bulk_show_price_flag(): void
    {
        $this->actingAsAdmin();
        $a = $this->product();
        $b = $this->product();

        $this->postJson('/api/v1/products/bulk/show-price', ['ids' => [$a->id], 'hidden' => true])
            ->assertOk();
        $this->assertDatabaseHas('products', ['id' => $a->id, 'is_price_hidden' => true]);

        $this->postJson('/api/v1/products/bulk/show-price', ['ids' => [$a->id, $b->id], 'hidden' => false])
            ->assertOk()->assertJsonPath('data.updated', 2);
        $this->assertDatabaseHas('products', ['id' => $a->id, 'is_price_hidden' => false]);
    }

    public function test_bulk_publish_toggles_both_ways_and_archives(): void
    {
        $this->actingAsAdmin();
        $a = $this->product(['status' => true, 'is_available' => true]);
        $b = $this->product(['status' => true]);

        // Publishing needs a supplier to order from, so give A one. Storefront
        // visibility (`is_available`) is a separate switch and must survive.
        $mapping = SupplierProduct::factory()->create([
            'product_id' => $a->id,
            'supplier_id' => Supplier::factory()->create()->id,
            'is_active' => true,
            'buyer_product_status' => true,
            'sync_deactivated_at' => now(),
        ]);

        $this->postJson('/api/v1/products/bulk/publish', ['ids' => [$a->id], 'published' => false])
            ->assertOk()->assertJsonPath('data.updated', 1);
        $this->assertDatabaseHas('products', ['id' => $a->id, 'status' => false, 'is_available' => true]);
        // Both halves go off together, and the checker's stamp is cleared so the
        // 5-minute sync cannot put the product back on sale by itself.
        $this->assertDatabaseHas('supplier_products', [
            'id' => $mapping->id, 'is_active' => false, 'sync_deactivated_at' => null,
        ]);

        $this->postJson('/api/v1/products/bulk/publish', ['ids' => [$a->id], 'published' => true])
            ->assertOk()->assertJsonPath('data.updated', 1);
        $this->assertDatabaseHas('products', ['id' => $a->id, 'status' => true]);
        $this->assertDatabaseHas('supplier_products', ['id' => $mapping->id, 'is_active' => true]);

        // Delete archives: the row survives so its order history keeps resolving.
        $this->postJson('/api/v1/products/bulk/delete', ['ids' => [$a->id, $b->id]])
            ->assertOk()->assertJsonPath('data.deleted', 2);
        $this->assertSoftDeleted('products', ['id' => $a->id]);
    }

    /** A product with no supplier cannot be published, and says so per row. */
    public function test_bulk_publish_skips_a_product_with_no_supplier(): void
    {
        $this->actingAsAdmin();
        $orphan = $this->product(['status' => false]);

        $this->postJson('/api/v1/products/bulk/publish', ['ids' => [$orphan->id], 'published' => true])
            ->assertOk()
            ->assertJsonPath('data.updated', 0)
            ->assertJsonPath('data.skipped.0.reason', 'Produk belum punya mapping supplier.');

        $this->assertDatabaseHas('products', ['id' => $orphan->id, 'status' => false]);
    }

    public function test_set_price_limit_clamps_stored_prices(): void
    {
        $this->actingAsAdmin();
        $product = $this->product();

        // Floor 11800: member (12000) stays, agent (10500) lifts to the floor.
        $this->postJson("/api/v1/products/{$product->id}/price-limit", ['price_min' => 11800])
            ->assertOk()
            ->assertJsonPath('data.price_min', 11800);

        $this->assertDatabaseHas('products', ['id' => $product->id, 'price_agent' => 11800, 'price_member' => 12000]);
    }

    /**
     * The window binds what is charged, not just the copy of it. A plan row left
     * outside the window is a price the storefront would still quote — and it
     * would also leave `price_member` disagreeing with the row, which is the
     * drift the deploy gate refuses.
     */
    public function test_set_price_limit_clamps_the_plan_row_too(): void
    {
        $this->actingAsAdmin();
        $product = $this->product();

        ProductPlanPrice::create([
            'product_id' => $product->id,
            'membership_plan_id' => DefaultPlan::id(),
            'price' => 9000,
            // Manual, and still clamped: the admin is setting the window now, so
            // a stored price below the new floor is exactly what they mean to fix.
            'is_manual' => true,
        ]);

        $this->postJson("/api/v1/products/{$product->id}/price-limit", ['price_min' => 11800])->assertOk();

        $this->assertSame(
            11800,
            (int) ProductPlanPrice::where('product_id', $product->id)
                ->where('membership_plan_id', DefaultPlan::id())
                ->value('price'),
        );
        $this->assertDatabaseHas('products', ['id' => $product->id, 'price_member' => 11800]);

        $this->artisan('pricing:verify')->assertSuccessful();
    }

    public function test_uxiolabs_update_recomputes_from_cost(): void
    {
        $this->actingAsAdmin();
        $product = $this->product(['price_member' => 0]);
        $mapping = SupplierProduct::factory()->create([
            'product_id' => $product->id,
            'supplier_id' => Supplier::factory()->create()->id,
            'price' => 10000,
            'is_active' => true,
        ]);

        $this->postJson('/api/v1/products/bulk/uxiolabs-update', ['ids' => [$product->id]])->assertOk();
        // Recomputed member = ceil(10000 * 1.2) = 12000.
        $this->assertDatabaseHas('products', ['id' => $product->id, 'price_member' => 12000]);
        // And it lands where the storefront bills from, not only in the copy —
        // otherwise a cost rise would be announced and never charged.
        $this->assertSame(12000, (int) ProductPlanPrice::where('product_id', $product->id)
            ->where('membership_plan_id', DefaultPlan::id())->value('price'));

        // A row still flagged from the old lock feature is recomputed too: the flag
        // freezes nothing any more, and honouring it here would leave the product
        // priced below its cost — which is what made checkout refuse an order.
        $product->update(['is_price_locked' => true]);
        $mapping->update(['price' => 20000]);
        $this->postJson('/api/v1/products/bulk/uxiolabs-update', ['ids' => [$product->id]])->assertOk();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'price_member' => 24000]);
        $this->assertSame(24000, (int) ProductPlanPrice::where('product_id', $product->id)
            ->where('membership_plan_id', DefaultPlan::id())->value('price'));

        $this->artisan('pricing:verify')->assertSuccessful();
    }

    public function test_bulk_endpoints_validate_ids(): void
    {
        $this->actingAsAdmin();
        $this->postJson('/api/v1/products/bulk/delete', ['ids' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['ids']);
    }
}
