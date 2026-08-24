<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Supplier;
use App\Models\SupplierCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupplierCategory>
 */
class SupplierCategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'supplier_id' => Supplier::factory(),
            // The provider's own free-text `kategori` string, e.g. "Mobile Legends".
            'provider_category' => fake()->unique()->words(2, true),
        ];
    }
}
