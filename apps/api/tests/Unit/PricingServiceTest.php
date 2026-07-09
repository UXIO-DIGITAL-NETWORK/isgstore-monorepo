<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Models\PricingRule;
use App\Services\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_global_rules_compute_all_role_prices(): void
    {
        PricingRule::factory()->create(['role' => 'member', 'markup_percent' => 20, 'markup_flat' => 0]);
        PricingRule::factory()->create(['role' => 'vip', 'markup_percent' => 15, 'markup_flat' => 0]);
        PricingRule::factory()->create(['role' => 'reseller', 'markup_percent' => 10, 'markup_flat' => 0]);
        PricingRule::factory()->create(['role' => 'agent', 'markup_percent' => 5, 'markup_flat' => 0]);

        $prices = app(PricingService::class)->computePrices(10000, null);

        $this->assertSame([
            'price_modal' => 10000,
            'price_member' => 12000,
            'price_vip' => 11500,
            'price_reseller' => 11000,
            'price_agent' => 10500,
        ], $prices);
    }

    public function test_rounding_uses_ceil_so_price_never_drops_below_markup(): void
    {
        PricingRule::factory()->create(['role' => 'member', 'markup_percent' => 5, 'markup_flat' => 0]);

        $prices = app(PricingService::class)->computePrices(999, null);

        // 999 * 1.05 = 1048.95 → 1049, never rounded down to 1048.
        $this->assertSame(1049, $prices['price_member']);
    }

    public function test_markup_flat_is_added_after_percent(): void
    {
        PricingRule::factory()->create(['role' => 'member', 'markup_percent' => 10, 'markup_flat' => 500]);

        $prices = app(PricingService::class)->computePrices(10000, null);

        $this->assertSame(11500, $prices['price_member']);
    }

    public function test_category_rule_overrides_global_rule(): void
    {
        $category = Category::factory()->create();
        PricingRule::factory()->create(['role' => 'member', 'markup_percent' => 20]);
        PricingRule::factory()->create(['category_id' => $category->id, 'role' => 'member', 'markup_percent' => 50]);

        $service = app(PricingService::class);

        $this->assertSame(15000, $service->computePrices(10000, $category->id)['price_member']);
        $this->assertSame(12000, $service->computePrices(10000, null)['price_member']);
    }

    public function test_built_in_defaults_apply_when_no_rules_exist(): void
    {
        $prices = app(PricingService::class)->computePrices(10000, null);

        // Products must never silently sell at cost on an unconfigured DB.
        $this->assertSame(12000, $prices['price_member']);
        $this->assertSame(11500, $prices['price_vip']);
        $this->assertSame(11000, $prices['price_reseller']);
        $this->assertSame(10500, $prices['price_agent']);
    }
}
