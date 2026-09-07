<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Models\MembershipPlan;
use App\Models\PricingRule;
use App\Services\PricingService;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pricing is keyed on membership plans now, not on role names, so the number of
 * tiers is a data question. These tests are written against
 * `computePlanPrices()`; `computePrices()` is only the transitional bridge that
 * keeps the legacy `products.price_*` columns filled.
 */
class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    private function plan(string $code, int $sortOrder = 1): MembershipPlan
    {
        return MembershipPlan::create([
            'code' => $code,
            'name' => ['id' => ucfirst($code), 'en' => ucfirst($code)],
            'price' => 0,
            'duration_days' => null,
            'is_active' => true,
            'sort_order' => $sortOrder,
        ]);
    }

    public function test_a_rule_per_plan_prices_every_plan(): void
    {
        $default = DefaultPlan::get();
        $platinum = $this->plan('platinum', 2);
        $gold = $this->plan('gold', 3);

        PricingRule::factory()->create(['membership_plan_id' => $default->id, 'markup_percent' => 20]);
        PricingRule::factory()->create(['membership_plan_id' => $platinum->id, 'markup_percent' => 15]);
        PricingRule::factory()->create(['membership_plan_id' => $gold->id, 'markup_percent' => 10]);

        $prices = app(PricingService::class)->computePlanPrices(10000, null);

        $this->assertSame(12000, $prices[$default->id]);
        $this->assertSame(11500, $prices[$platinum->id]);
        $this->assertSame(11000, $prices[$gold->id]);
    }

    public function test_a_plan_with_no_rule_of_its_own_falls_through_to_the_all_plans_rule(): void
    {
        // The rung that makes an admin-invented plan priced rather than
        // unpriced: a rule with no plan applies to every plan.
        $default = DefaultPlan::get();
        $hokage = $this->plan('hokage', 5);

        PricingRule::factory()->create(['membership_plan_id' => null, 'markup_percent' => 30]);
        PricingRule::factory()->create(['membership_plan_id' => $default->id, 'markup_percent' => 20]);

        $prices = app(PricingService::class)->computePlanPrices(10000, null);

        $this->assertSame(12000, $prices[$default->id], 'Its own rule wins.');
        $this->assertSame(13000, $prices[$hokage->id], 'No rule of its own — the all-plans rule applies.');
    }

    public function test_the_resolution_chain_prefers_the_most_specific_rule(): void
    {
        $category = Category::factory()->create();
        $default = DefaultPlan::get();
        $service = app(PricingService::class);

        PricingRule::factory()->create(['category_id' => null, 'membership_plan_id' => null, 'markup_percent' => 5]);
        PricingRule::factory()->create(['category_id' => $category->id, 'membership_plan_id' => null, 'markup_percent' => 10]);
        PricingRule::factory()->create(['category_id' => null, 'membership_plan_id' => $default->id, 'markup_percent' => 20]);
        PricingRule::factory()->create(['category_id' => $category->id, 'membership_plan_id' => $default->id, 'markup_percent' => 50]);

        // (category, plan) beats (NULL, plan) beats (category, NULL) beats (NULL, NULL).
        $this->assertSame(15000, $service->computePlanPrices(10000, $category->id)[$default->id]);

        PricingRule::query()->where('category_id', $category->id)->where('membership_plan_id', $default->id)->delete();
        $service = app(PricingService::class); // rules are cached per instance
        $this->assertSame(12000, $service->computePlanPrices(10000, $category->id)[$default->id]);

        PricingRule::query()->whereNotNull('membership_plan_id')->delete();
        $service = app(PricingService::class);
        $this->assertSame(11000, $service->computePlanPrices(10000, $category->id)[$default->id]);

        PricingRule::query()->whereNotNull('category_id')->delete();
        $service = app(PricingService::class);
        $this->assertSame(10500, $service->computePlanPrices(10000, $category->id)[$default->id]);
    }

    public function test_rounding_uses_ceil_so_price_never_drops_below_markup(): void
    {
        $default = DefaultPlan::get();
        PricingRule::factory()->create(['membership_plan_id' => $default->id, 'markup_percent' => 5, 'markup_flat' => 0]);

        // 999 * 1.05 = 1048.95 → 1049, never rounded down to 1048.
        $this->assertSame(1049, app(PricingService::class)->computePlanPrices(999, null)[$default->id]);
    }

    public function test_markup_flat_is_added_after_percent(): void
    {
        $default = DefaultPlan::get();
        PricingRule::factory()->create(['membership_plan_id' => $default->id, 'markup_percent' => 10, 'markup_flat' => 500]);

        $this->assertSame(11500, app(PricingService::class)->computePlanPrices(10000, null)[$default->id]);
    }

    public function test_the_fallback_markup_applies_when_nothing_is_configured(): void
    {
        // Products must never silently sell at cost on an unconfigured DB. A
        // single scalar, not a per-role map: there is no sensible built-in
        // default for a tier an admin invented this morning.
        $default = DefaultPlan::get();
        $extra = $this->plan('extra', 9);

        $prices = app(PricingService::class)->computePlanPrices(10000, null);

        $this->assertSame(12000, $prices[$default->id]);
        $this->assertSame(12000, $prices[$extra->id]);
    }

    public function test_a_margin_override_beats_every_rule(): void
    {
        $default = DefaultPlan::get();
        PricingRule::factory()->create(['membership_plan_id' => $default->id, 'markup_percent' => 20]);

        $prices = app(PricingService::class)->computePlanPrices(10000, null, [$default->id => 50.0]);

        $this->assertSame(15000, $prices[$default->id]);
    }

    public function test_prices_are_clamped_to_the_product_window(): void
    {
        $default = DefaultPlan::get();
        PricingRule::factory()->create(['membership_plan_id' => $default->id, 'markup_percent' => 20]);
        $service = app(PricingService::class);

        $this->assertSame(12500, $service->computePlanPrices(10000, null, [], 12500, null)[$default->id]);
        $this->assertSame(11200, $service->computePlanPrices(10000, null, [], null, 11200)[$default->id]);
        // 0 means "no limit", not "clamp to zero".
        $this->assertSame(12000, $service->computePlanPrices(10000, null, [], 0, 0)[$default->id]);
    }

    public function test_the_legacy_column_bridge_still_fills_the_old_shape(): void
    {
        // `products.price_*` are NOT NULL and six queries still sort on
        // price_member, so the bridge has to keep answering until they are
        // dropped.
        $default = DefaultPlan::get();
        PricingRule::factory()->create(['membership_plan_id' => $default->id, 'markup_percent' => 20]);

        $prices = app(PricingService::class)->computePrices(10000, null);

        $this->assertSame(10000, $prices['price_modal']);
        $this->assertSame(12000, $prices['price_member']);
        // No plan grants VIP in this database, so the tier mirrors the default.
        $this->assertSame(12000, $prices['price_vip']);
    }
}
