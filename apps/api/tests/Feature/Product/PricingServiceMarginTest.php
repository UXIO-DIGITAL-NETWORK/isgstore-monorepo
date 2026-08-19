<?php

namespace Tests\Feature\Product;

use App\Services\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingServiceMarginTest extends TestCase
{
    use RefreshDatabase;

    public function test_falls_back_to_default_markups_without_rules_or_overrides(): void
    {
        $prices = (new PricingService)->computePrices(10000, null);

        $this->assertSame(10000, $prices['price_modal']);
        $this->assertSame(12000, $prices['price_member']);   // +20%
        $this->assertSame(11500, $prices['price_vip']);      // +15%
        $this->assertSame(11000, $prices['price_reseller']); // +10%
        $this->assertSame(10500, $prices['price_agent']);    // +5%
    }

    public function test_per_tier_margin_override_wins_over_defaults(): void
    {
        $prices = (new PricingService)->computePrices(10000, null, [
            'member' => 1.0,   // +1% → 10100
            'vip' => 2.5,      // +2.5% → 10250
        ]);

        $this->assertSame(10100, $prices['price_member']);
        $this->assertSame(10250, $prices['price_vip']);
        // Untouched tiers keep the default markup.
        $this->assertSame(11000, $prices['price_reseller']);
    }

    public function test_clamps_selling_prices_to_the_min_and_max_limits(): void
    {
        // Floor at 11800: member (12000) untouched, everyone below is lifted.
        $floored = (new PricingService)->computePrices(10000, null, [], 11800, null);
        $this->assertSame(12000, $floored['price_member']);
        $this->assertSame(11800, $floored['price_agent']);   // 10500 lifted to floor

        // Ceiling at 11200: everyone above is capped, modal stays at cost.
        $capped = (new PricingService)->computePrices(10000, null, [], null, 11200);
        $this->assertSame(11200, $capped['price_member']);   // 12000 capped
        $this->assertSame(10000, $capped['price_modal']);
        $this->assertSame(10500, $capped['price_agent']);    // under the cap, untouched
    }

    public function test_zero_limits_mean_no_clamping(): void
    {
        $prices = (new PricingService)->computePrices(10000, null, [], 0, 0);

        $this->assertSame(12000, $prices['price_member']);
        $this->assertSame(10500, $prices['price_agent']);
    }
}
