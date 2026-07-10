<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupplierProduct>
 */
class SupplierProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'supplier_id' => Supplier::factory(),
            'buyer_sku_code' => fake()->unique()->bothify('df####??'),
            'price' => 10000,
            'admin_fee' => null,
            'commission' => null,
            'buyer_product_status' => true,
            'seller_product_status' => true,
            'is_active' => true,
            'sync_deactivated_at' => null,
        ];
    }
}
