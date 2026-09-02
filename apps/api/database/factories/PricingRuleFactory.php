<?php

namespace Database\Factories;

use App\Models\PricingRule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PricingRule>
 */
class PricingRuleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => null,
            // Null means "every plan". Tests that care about a specific tier
            // pass a plan id; the ones that only need *a* rule get the broad
            // one, which is what an unconfigured deployment looks like.
            'membership_plan_id' => null,
            // `role` is the retired key, still NOT NULL until the follow-up
            // migration drops it.
            'role' => 'member',
            'markup_percent' => 20,
            'markup_flat' => 0,
        ];
    }
}
