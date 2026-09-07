<?php

namespace Tests\Unit\Support;

use App\Models\Product;
use App\Models\Setting;
use App\Support\Points\PointRules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The earning rule is quoted to the customer at checkout and applied again when
 * the order completes. Both readings come from here, so a disagreement in this
 * class is a customer promised points they never receive.
 */
class PointRulesTest extends TestCase
{
    use RefreshDatabase;

    private function setting(string $key, string $value): void
    {
        Setting::create([
            'group' => 'points',
            'key' => $key,
            'value' => $value,
            'type' => 'number',
            'label' => $key,
            'is_public' => true,
        ]);
    }

    public function test_a_product_without_overrides_uses_the_global_rule(): void
    {
        $this->setting('earn_percent', '2');
        $this->setting('earn_flat', '5');

        $product = new Product(['point_percent' => null, 'point_flat' => null]);

        $this->assertSame(['percent' => 2.0, 'flat' => 5], PointRules::effectiveRuleFor($product));
    }

    public function test_product_overrides_win_over_the_global_rule(): void
    {
        $this->setting('earn_percent', '2');
        $this->setting('earn_flat', '5');

        $product = new Product(['point_percent' => 7.5, 'point_flat' => 0]);

        $this->assertSame(['percent' => 7.5, 'flat' => 0], PointRules::effectiveRuleFor($product));
    }

    public function test_globals_may_be_supplied_by_the_caller(): void
    {
        // A listing reads the settings once; nothing here should touch them.
        $rule = PointRules::effectiveRuleFor(
            new Product(['point_percent' => null, 'point_flat' => null]),
            ['percent' => 3.0, 'flat' => 1],
        );

        $this->assertSame(['percent' => 3.0, 'flat' => 1], $rule);
    }

    public function test_earning_rounds_the_percent_up_and_adds_the_flat(): void
    {
        $this->setting('earn_percent', '1');
        $this->setting('earn_flat', '5');

        // 25.000 * 1% = 250, plus the flat 5.
        $this->assertSame(255, PointRules::earnedFor(null, 25000));
        // 10.010 * 1% = 100,1 → rounded up, never against the customer.
        $this->assertSame(106, PointRules::earnedFor(null, 10010));
        $this->assertSame(0, PointRules::earnedFor(null, 0));
    }
}
