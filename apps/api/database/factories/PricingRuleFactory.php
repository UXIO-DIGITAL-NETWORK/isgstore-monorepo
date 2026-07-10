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
            'role' => 'member',
            'markup_percent' => 20,
            'markup_flat' => 0,
        ];
    }
}
