<?php

namespace Database\Factories;

use App\Enums\PriceAlertStatus;
use App\Models\PriceChangeAlert;
use App\Models\SupplierProduct;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PriceChangeAlert>
 */
class PriceChangeAlertFactory extends Factory
{
    public function definition(): array
    {
        return [
            'supplier_product_id' => SupplierProduct::factory(),
            'buyer_sku_code' => 'sku'.$this->faker->unique()->numberBetween(1, 99999),
            'type' => 'prepaid',
            'old_price' => 10000,
            'new_price' => 12000,
            'status' => PriceAlertStatus::PENDING,
        ];
    }

    public function acknowledged(): static
    {
        return $this->state(fn () => [
            'status' => PriceAlertStatus::ACKNOWLEDGED,
            'acknowledged_at' => now(),
        ]);
    }
}
