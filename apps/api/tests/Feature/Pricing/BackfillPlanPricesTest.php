<?php

namespace Tests\Feature\Pricing;

use App\Models\MembershipPlan;
use App\Models\Product;
use App\Models\ProductPlanPrice;
use App\Models\Role;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The backfill is what stands between the migration and a silent revenue leak:
 * until it has run, the price table is empty, `PlanPrice` falls through to
 * `products.price_member`, and every paying member is sold at the base tier
 * without anything erroring.
 */
class BackfillPlanPricesTest extends TestCase
{
    use RefreshDatabase;

    private function planForRole(string $roleName, string $code): MembershipPlan
    {
        $role = Role::factory()->create(['name' => $roleName]);

        return MembershipPlan::create([
            'code' => $code,
            'name' => ['id' => $code],
            'price' => 50000,
            'duration_days' => null,
            'role_id' => $role->id,
            'is_active' => true,
            'sort_order' => 2,
        ]);
    }

    public function test_it_seeds_each_plan_from_the_tier_it_already_had(): void
    {
        // The cutover must change nobody's price: a plan that granted VIP
        // inherits price_vip, and the default tier inherits price_member.
        $vipPlan = $this->planForRole('VIP', 'basic');
        $product = Product::factory()->create([
            'price_modal' => 10000,
            'price_member' => 25000,
            'price_vip' => 21000,
        ]);

        $this->artisan('pricing:backfill-plan-prices')->assertSuccessful();

        $this->assertSame(25000, (int) ProductPlanPrice::where('product_id', $product->id)
            ->where('membership_plan_id', DefaultPlan::id())->value('price'));
        $this->assertSame(21000, (int) ProductPlanPrice::where('product_id', $product->id)
            ->where('membership_plan_id', $vipPlan->id)->value('price'));
    }

    public function test_a_plan_with_no_legacy_counterpart_is_priced_from_cost(): void
    {
        $hokage = MembershipPlan::create([
            'code' => 'hokage',
            'name' => ['id' => 'Hokage'],
            'price' => 10000,
            'duration_days' => 30,
            'is_active' => true,
            'sort_order' => 5,
        ]);

        Product::factory()->create(['price_modal' => 10000, 'price_member' => 25000]);

        $this->artisan('pricing:backfill-plan-prices')->assertSuccessful();

        // No column to inherit, so it is derived through the pricing rules —
        // the default markup of 20% over cost.
        $this->assertSame(12000, (int) ProductPlanPrice::where('membership_plan_id', $hokage->id)->value('price'));
    }

    public function test_it_is_idempotent_and_never_overwrites_a_manual_price(): void
    {
        $product = Product::factory()->create(['price_modal' => 10000, 'price_member' => 25000]);

        ProductPlanPrice::create([
            'product_id' => $product->id,
            'membership_plan_id' => DefaultPlan::id(),
            'price' => 19000,
            'is_manual' => true,
        ]);

        $this->artisan('pricing:backfill-plan-prices')->assertSuccessful();
        $this->artisan('pricing:backfill-plan-prices')->assertSuccessful();

        $this->assertSame(1, ProductPlanPrice::where('product_id', $product->id)->count());
        $this->assertSame(19000, (int) ProductPlanPrice::where('product_id', $product->id)->value('price'));
    }

    public function test_dry_run_writes_nothing(): void
    {
        Product::factory()->create(['price_modal' => 10000, 'price_member' => 25000]);

        $this->artisan('pricing:backfill-plan-prices', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(0, ProductPlanPrice::count());
    }

    public function test_verify_fails_loudly_when_the_backfill_never_ran(): void
    {
        // This is the deploy gate. An empty price table alongside real products
        // is wrong prices, not an outage, so nothing else would notice.
        Product::factory()->create(['price_modal' => 10000, 'price_member' => 25000]);

        $this->artisan('pricing:verify')->assertFailed();

        $this->artisan('pricing:backfill-plan-prices')->assertSuccessful();

        $this->artisan('pricing:verify')->assertSuccessful();
    }

    public function test_verify_catches_price_member_drifting_from_the_default_plan(): void
    {
        // `price_member` is a denormalised copy kept only so six sort/filter
        // queries can stay on an index. This proves no second writer appeared.
        $product = Product::factory()->create(['price_modal' => 10000, 'price_member' => 25000]);
        $this->artisan('pricing:backfill-plan-prices')->assertSuccessful();

        ProductPlanPrice::where('product_id', $product->id)
            ->where('membership_plan_id', DefaultPlan::id())
            ->update(['price' => 19000]);

        $this->artisan('pricing:verify')->assertFailed();
    }

    public function test_the_backfill_reconciles_a_drifted_copy_from_the_plan_row(): void
    {
        // What the legacy writers left behind in production: the column and the
        // row disagree. The copy follows the row, because that is the only
        // direction that cannot change what a customer is charged — and the one
        // that lets the deploy gate pass again without editing production data
        // by hand.
        $product = Product::factory()->create(['price_modal' => 10000, 'price_member' => 25000]);
        $this->artisan('pricing:backfill-plan-prices')->assertSuccessful();

        $product->forceFill(['price_member' => 31000])->save();
        $this->artisan('pricing:verify')->assertFailed();

        $this->artisan('pricing:backfill-plan-prices')->assertSuccessful();

        $this->assertSame(25000, (int) $product->fresh()->price_member);
        $this->assertSame(
            25000,
            (int) ProductPlanPrice::where('product_id', $product->id)
                ->where('membership_plan_id', DefaultPlan::id())
                ->value('price'),
            'Reconciling the copy must not move the price that is billed.',
        );

        $this->artisan('pricing:verify')->assertSuccessful();
    }

    public function test_a_dry_run_reconciles_nothing(): void
    {
        $product = Product::factory()->create(['price_modal' => 10000, 'price_member' => 25000]);
        $this->artisan('pricing:backfill-plan-prices')->assertSuccessful();

        $product->forceFill(['price_member' => 31000])->save();

        $this->artisan('pricing:backfill-plan-prices', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(31000, (int) $product->fresh()->price_member);
    }
}
