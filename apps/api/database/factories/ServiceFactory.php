<?php

namespace Database\Factories;

use App\Enums\ServiceCategory;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->slug(2),
            'name' => fake()->words(2, true),
            'category' => ServiceCategory::OTHER->value,
            'description' => fake()->sentence(),
            'features' => ['Fitur A', 'Fitur B'],
            'cost_price' => 180000,
            'selling_price' => 250000,
            'duration_days' => 30,
            'payment_channel_id' => null,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
