<?php

namespace Tests\Feature\Pricing;

use App\Models\MembershipPlan;
use App\Models\ProductPlanPrice;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\SupplierProductMargin;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Per-SKU margins were the last four-tier cap in the pricing chain: an admin
 * could set a price rule for a plan they had just created, but not a margin.
 */
class SupplierProductPlanMarginTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function plan(string $code, int $sortOrder): MembershipPlan
    {
        return MembershipPlan::create([
            'code' => $code,
            'name' => ['id' => ucfirst($code)],
            'price' => 100000,
            'duration_days' => null,
            'is_active' => true,
            'sort_order' => $sortOrder,
        ]);
    }

    private function mapping(): SupplierProduct
    {
        return SupplierProduct::factory()->create([
            'supplier_id' => Supplier::factory()->create(['is_system' => false])->id,
            'price' => 10000,
            'is_active' => true,
        ]);
    }

    public function test_an_admin_can_set_a_margin_for_a_plan_they_just_created(): void
    {
        $this->actingAsAdmin();
        $hokage = $this->plan('hokage', 5);
        $mapping = $this->mapping();

        $this->postJson("/api/v1/supplier-products/{$mapping->id}/profit-margin", [
            'margins' => [
                DefaultPlan::id() => 20,
                $hokage->id => 3,
            ],
        ])->assertOk();

        $this->assertSame(20.0, (float) SupplierProductMargin::where('supplier_product_id', $mapping->id)
            ->where('membership_plan_id', DefaultPlan::id())->value('margin_percent'));
        $this->assertSame(3.0, (float) SupplierProductMargin::where('supplier_product_id', $mapping->id)
            ->where('membership_plan_id', $hokage->id)->value('margin_percent'));
    }

    public function test_margins_flow_through_to_the_products_plan_prices(): void
    {
        $this->actingAsAdmin();
        $gold = $this->plan('gold', 3);
        $mapping = $this->mapping();

        $this->postJson("/api/v1/supplier-products/{$mapping->id}/profit-margin", [
            'margins' => [
                DefaultPlan::id() => 20,   // 10000 → 12000
                $gold->id => 5,            // 10000 → 10500
            ],
        ])->assertOk();

        $productId = $mapping->fresh()->product_id;

        $this->assertSame(12000, (int) ProductPlanPrice::where('product_id', $productId)
            ->where('membership_plan_id', DefaultPlan::id())->value('price'));
        $this->assertSame(10500, (int) ProductPlanPrice::where('product_id', $productId)
            ->where('membership_plan_id', $gold->id)->value('price'));
    }

    public function test_a_null_margin_clears_the_row_rather_than_storing_zero(): void
    {
        // Null means "use the pricing rules". Storing 0% would sell at cost —
        // a very different instruction wearing the same clothes.
        $this->actingAsAdmin();
        $mapping = $this->mapping();

        $this->postJson("/api/v1/supplier-products/{$mapping->id}/profit-margin", [
            'margins' => [DefaultPlan::id() => 25],
        ])->assertOk();

        $this->assertSame(1, SupplierProductMargin::where('supplier_product_id', $mapping->id)->count());

        $this->postJson("/api/v1/supplier-products/{$mapping->id}/profit-margin", [
            'margins' => [DefaultPlan::id() => null],
        ])->assertOk();

        $this->assertSame(0, SupplierProductMargin::where('supplier_product_id', $mapping->id)->count());
    }

    public function test_an_omitted_plan_is_left_exactly_as_it_was(): void
    {
        // Clearing one tier must not silently clear the others.
        $this->actingAsAdmin();
        $gold = $this->plan('gold', 3);
        $mapping = $this->mapping();

        $this->postJson("/api/v1/supplier-products/{$mapping->id}/profit-margin", [
            'margins' => [DefaultPlan::id() => 20, $gold->id => 5],
        ])->assertOk();

        $this->postJson("/api/v1/supplier-products/{$mapping->id}/profit-margin", [
            'margins' => [DefaultPlan::id() => 30],
        ])->assertOk();

        $this->assertSame(5.0, (float) SupplierProductMargin::where('supplier_product_id', $mapping->id)
            ->where('membership_plan_id', $gold->id)->value('margin_percent'));
    }

    public function test_a_legacy_role_keyed_body_still_works(): void
    {
        // The bulk screen and any older client keep posting margin_member etc.
        // until they are migrated; the request translates onto the plans those
        // roles granted.
        $this->actingAsAdmin();
        $mapping = $this->mapping();

        $this->postJson("/api/v1/supplier-products/{$mapping->id}/profit-margin", [
            'margin_member' => 1.0,
        ])->assertOk();

        $this->assertSame(1.0, (float) SupplierProductMargin::where('supplier_product_id', $mapping->id)
            ->where('membership_plan_id', DefaultPlan::id())->value('margin_percent'));
    }
}
