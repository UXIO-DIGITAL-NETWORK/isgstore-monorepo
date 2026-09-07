<?php

declare(strict_types=1);

namespace Tests\Feature\Pricing;

use App\Models\Category;
use App\Models\MembershipPlan;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use App\Support\Points\PointRules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * What the Set Profit Margin page reads back after it saves.
 *
 * The margins were always stored correctly; the page showed Rp 0 at -100% for
 * every tier because the projected prices were attached as `preview_plan_prices`
 * and serialised as `preview_prices`, so the key never reached the response and
 * the admin table fell back to zero. Nothing covered the list endpoint's JSON
 * for a pooled row, which is exactly how that rename slipped through — hence
 * these tests.
 */
class ProviderMarginPreviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    /** A pooled mapping: priced, but not yet promoted to a product. */
    private function pooledMapping(int $cost = 1636): SupplierProduct
    {
        return SupplierProduct::factory()->create([
            'supplier_id' => Supplier::factory()->create(['is_system' => false])->id,
            'product_id' => null,
            'pool_category_id' => Category::factory()->create()->id,
            'price' => $cost,
            'is_active' => true,
        ]);
    }

    private function listRow(SupplierProduct $mapping): array
    {
        return $this->getJson("/api/v1/supplier-products?ids={$mapping->id}")
            ->assertOk()
            // The paginator's own envelope sits inside the API's `data`.
            ->json('data.data.0');
    }

    public function test_a_pooled_row_previews_a_price_for_every_active_plan(): void
    {
        $mapping = $this->pooledMapping(1636);
        $defaultPlanId = DefaultPlan::id();

        $this->postJson('/api/v1/supplier-products/bulk/profit-margin', [
            'ids' => [$mapping->id],
            'margins' => [$defaultPlanId => 100],
        ])->assertOk();

        $row = $this->listRow($mapping);
        $preview = collect($row['preview_plan_prices']);

        $this->assertNotEmpty($preview, 'A pooled row must preview the prices its margins produce.');
        $this->assertSame(
            MembershipPlan::where('is_active', true)->count(),
            $preview->count(),
        );

        $default = $preview->firstWhere('membership_plan_id', $defaultPlanId);

        // 100% over a cost of 1.636 — the number the admin typed, read back.
        $this->assertSame(3272, $default['price']);
        $this->assertTrue($default['is_default']);
        $this->assertNotNull($default['plan_name']);
        $this->assertNotNull($default['plan_code']);
    }

    public function test_saved_margins_are_returned_so_the_form_can_prefill(): void
    {
        $mapping = $this->pooledMapping();
        $planId = DefaultPlan::id();

        $this->postJson('/api/v1/supplier-products/bulk/profit-margin', [
            'ids' => [$mapping->id],
            'margins' => [$planId => 25],
        ])->assertOk();

        $margins = collect($this->listRow($mapping)['plan_margins']);

        // assertEquals, not assertSame: JSON renders a whole float as 25.
        $this->assertEquals(25, $margins->firstWhere('membership_plan_id', $planId)['margin_percent']);
    }

    public function test_points_are_stored_on_the_mapping_and_carried_by_promote(): void
    {
        $mapping = $this->pooledMapping();

        $this->postJson('/api/v1/supplier-products/bulk/profit-margin', [
            'ids' => [$mapping->id],
            'margins' => [DefaultPlan::id() => 20],
            'point_percent' => 2.5,
            'point_flat' => 50,
        ])->assertOk();

        $this->assertDatabaseHas('supplier_products', [
            'id' => $mapping->id,
            'point_percent' => 2.5,
            'point_flat' => 50,
        ]);

        $this->postJson("/api/v1/supplier-products/{$mapping->id}/promote")->assertCreated();

        $product = $mapping->fresh()->product;

        $this->assertSame(50, (int) $product->point_flat);
        // 2.5% of 10.000 plus the 50-point sweetener.
        $this->assertSame(300, PointRules::earnedFor($product, 10000));
    }

    /**
     * A save that carries no point fields at all — the single-row margin form,
     * or an older client — must leave an existing override alone.
     */
    public function test_omitting_the_point_fields_leaves_them_untouched(): void
    {
        $mapping = $this->pooledMapping();
        $mapping->update(['point_percent' => 3, 'point_flat' => 10]);

        $this->postJson('/api/v1/supplier-products/bulk/profit-margin', [
            'ids' => [$mapping->id],
            'margins' => [DefaultPlan::id() => 20],
        ])->assertOk();

        $mapping->refresh();

        $this->assertSame(3.0, (float) $mapping->point_percent);
        $this->assertSame(10, (int) $mapping->point_flat);
    }

    public function test_membership_plan_options_say_which_plan_is_the_default(): void
    {
        $plans = $this->getJson('/api/v1/membership-plans?per_page=100')
            ->assertOk()
            ->json('data.data');

        $this->assertNotEmpty($plans);

        foreach ($plans as $plan) {
            $this->assertArrayHasKey('is_default', $plan);
            $this->assertArrayHasKey('code', $plan);
        }

        $this->assertSame(
            1,
            collect($plans)->where('is_default', true)->count(),
            'Exactly one plan is the default tier, and the pricing screens label it.',
        );
    }
}
