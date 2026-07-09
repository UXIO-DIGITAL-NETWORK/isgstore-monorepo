<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\CategoryType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'type_id' => CategoryType::factory(),
            'name' => fake()->words(2, true),
            'code' => fake()->unique()->slug(2),
            'validasi_nickname' => null,
            'region' => 'ID',
            'status' => true,
        ];
    }
}
