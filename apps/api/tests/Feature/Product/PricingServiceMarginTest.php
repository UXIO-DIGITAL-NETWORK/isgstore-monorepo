<?php

namespace Tests\Feature\Product;

use App\Models\MembershipPlan;
use App\Services\PricingService;
use App\Support\Membership\DefaultPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Margins and price limits, exercised through the plan-keyed interface. Margins
 * are authored per plan now — the four fixed `supplier_products.margin_*`
 * columns capped the platform at four tiers, which is the whole thing this
 * release removes.
 */
class PricingServiceMarginTest extends TestCase
{
    use RefreshDatabase;

    private function extraPlan(string $code, int $sortOrder): MembershipPlan
    {
        return MembershipPlan::create([
            'code' => $code,
            'name' => ['id' => ucfirst($code)],
            'price' => 0,
            'duration_days' => null,
            'is_active' => true,
            'sort_order' => $sortOrder,
        ]);
    }

    public function test_falls_back_to_the_default_markup_without_rules_or_overrides(): void
    {
        $default = DefaultPlan::get();
        $gold = $this->extraPlan('gold', 3);

        $prices = (new PricingService)->computePlanPrices(10000, null);

        // One conservative markup for every unconfigured plan — a per-role map
        // could not answer for a tier an admin invented.
        $this->assertSame(12000, $prices[$default->id]);
        $this->assertSame(12000, $prices[$gold->id]);
    }

    public function test_a_per_plan_margin_override_wins_over_the_default(): void
    {
        $default = DefaultPlan::get();
        $gold = $this->extraPlan('gold', 3);

        $prices = (new PricingService)->computePlanPrices(10000, null, [
            $default->id => 1.0,   // +1% → 10100
            $gold->id => 2.5,      // +2.5% → 10250
        ]);

        $this->assertSame(10100, $prices[$default->id]);
        $this->assertSame(10250, $prices[$gold->id]);
    }

    public function test_clamps_selling_prices_to_the_min_and_max_limits(): void
    {
        $default = DefaultPlan::get();
        $gold = $this->extraPlan('gold', 3);
        $service = new PricingService;

        // Floor at 12500 lifts everyone below it.
        $floored = $service->computePlanPrices(10000, null, [$gold->id => 5.0], 12500, null);
        $this->assertSame(12500, $floored[$default->id]);
        $this->assertSame(12500, $floored[$gold->id]);

        // Ceiling at 11200 caps everyone above it.
        $capped = (new PricingService)->computePlanPrices(10000, null, [$gold->id => 5.0], null, 11200);
        $this->assertSame(11200, $capped[$default->id]);
        $this->assertSame(10500, $capped[$gold->id]);
    }

    public function test_zero_limits_mean_no_clamping(): void
    {
        $default = DefaultPlan::get();

        $prices = (new PricingService)->computePlanPrices(10000, null, [], 0, 0);

        $this->assertSame(12000, $prices[$default->id]);
    }
}
