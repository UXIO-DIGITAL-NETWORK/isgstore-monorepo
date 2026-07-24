<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\ServerCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServerCategory>
 */
class ServerCategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name' => fake()->words(2, true),
        ];
    }
}
