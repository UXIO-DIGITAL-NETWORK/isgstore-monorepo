<?php

declare(strict_types=1);

namespace Tests\Feature\Product;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\SupplierProductMargin;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use App\Support\Points\PointRules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Editing a product's margin from the Main Products form.
 *
 * Margins are authored on the provider mapping — that is where the scheduled
 * price checker reads them from, so a margin typed here has to land in the same
 * rows the Set Profit Margin screen writes, or a supplier cost change would
 * quietly revert it.
 */
class SetProductMarginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function mappedProduct(int $cost = 10000): Product
    {
        $product = Product::factory()->create([
            'category_id' => Category::factory()->create()->id,
            'price_modal' => $cost,
            'price_member' => $cost,
        ]);

        SupplierProduct::factory()->create([
            'product_id' => $product->id,
            'supplier_id' => Supplier::factory()->create(['is_system' => false])->id,
            'price' => $cost,
            'is_active' => true,
        ]);

        return $product;
    }

    public function test_a_margin_typed_here_is_authored_on_the_mapping(): void
    {
        $product = $this->mappedProduct();
        $planId = DefaultPlan::id();

        $this->postJson("/api/v1/products/{$product->id}/profit-margin", [
            'margins' => [$planId => 30],
        ])->assertOk();

        $mapping = $product->supplierProducts()->first();

        $this->assertDatabaseHas('supplier_product_margins', [
            'supplier_product_id' => $mapping->id,
            'membership_plan_id' => $planId,
            'margin_percent' => 30,
        ]);
    }

    public function test_the_new_price_is_written_and_returned(): void
    {
        $product = $this->mappedProduct(10000);
        $planId = DefaultPlan::id();

        $prices = $this->postJson("/api/v1/products/{$product->id}/profit-margin", [
            'margins' => [$planId => 30],
        ])->assertOk()->json('data.prices');

        $this->assertSame(13000, collect($prices)->firstWhere('membership_plan_id', $planId)['price']);
        // The denormalised copy the catalogue sorts on moves with it.
        $this->assertSame(13000, (int) $product->fresh()->price_member);
    }

    public function test_points_and_the_price_window_travel_with_the_margin(): void
    {
        $product = $this->mappedProduct();

        $this->postJson("/api/v1/products/{$product->id}/profit-margin", [
            'margins' => [DefaultPlan::id() => 20],
            'price_min' => 5000,
            'price_max' => 50000,
            'point_percent' => 1.5,
            'point_flat' => 10,
        ])->assertOk();

        $product->refresh();

        $this->assertSame(5000, (int) $product->price_min);
        $this->assertSame(50000, (int) $product->price_max);
        $this->assertSame(160, PointRules::earnedFor($product, 10000));
    }

    /**
     * A hand-made product never went through the pool, so it has no mapping to
     * author margins on — its prices are computed from its own cost instead.
     */
    public function test_a_product_without_a_mapping_is_still_priced(): void
    {
        $product = Product::factory()->create([
            'category_id' => Category::factory()->create()->id,
            'price_modal' => 20000,
            'price_member' => 20000,
        ]);

        $planId = DefaultPlan::id();

        $this->postJson("/api/v1/products/{$product->id}/profit-margin", [
            'margins' => [$planId => 25],
        ])->assertOk();

        $this->assertDatabaseHas('product_plan_prices', [
            'product_id' => $product->id,
            'membership_plan_id' => $planId,
            'price' => 25000,
        ]);
    }

    public function test_clearing_a_margin_falls_back_to_the_pricing_rules(): void
    {
        $product = $this->mappedProduct();
        $planId = DefaultPlan::id();

        $this->postJson("/api/v1/products/{$product->id}/profit-margin", ['margins' => [$planId => 30]])->assertOk();
        $this->postJson("/api/v1/products/{$product->id}/profit-margin", ['margins' => [$planId => null]])->assertOk();

        $this->assertSame(
            0,
            SupplierProductMargin::where('supplier_product_id', $product->supplierProducts()->first()->id)
                ->where('membership_plan_id', $planId)
                ->count(),
        );
    }

    public function test_a_margin_below_minus_one_hundred_is_rejected(): void
    {
        $product = $this->mappedProduct();

        $this->postJson("/api/v1/products/{$product->id}/profit-margin", [
            'margins' => [DefaultPlan::id() => -150],
        ])->assertStatus(422);
    }
}
