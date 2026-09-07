<?php

namespace Database\Factories;

use App\Enums\PriceChangeLogStatus;
use App\Models\PriceChangeLog;
use App\Models\Product;
use App\Models\SupplierProduct;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PriceChangeLog>
 */
class PriceChangeLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'supplier_product_id' => SupplierProduct::factory(),
            'product_id' => Product::factory(),
            'buyer_sku_code' => 'sku'.$this->faker->unique()->numberBetween(1, 99999),
            'product_name' => $this->faker->words(3, true),
            'status' => PriceChangeLogStatus::APPLIED,
            'old_cost' => 10000,
            'new_cost' => 12000,
            'old_price_member' => 12000,
            'new_price_member' => 14400,
            'old_price_vip' => 11500,
            'new_price_vip' => 13800,
            'old_price_reseller' => 11000,
            'new_price_reseller' => 13200,
            'old_price_agent' => 10500,
            'new_price_agent' => 12600,
            'reason' => 'Harga jual diperbarui otomatis dari aturan margin.',
        ];
    }

    public function applied(): static
    {
        return $this->state(fn () => ['status' => PriceChangeLogStatus::APPLIED]);
    }

    public function locked(): static
    {
        return $this->state(fn () => [
            'status' => PriceChangeLogStatus::LOCKED,
            'new_price_member' => null,
            'new_price_vip' => null,
            'new_price_reseller' => null,
            'new_price_agent' => null,
            'reason' => 'Harga terkunci — modal berubah tapi harga jual dibekukan. Tinjau.',
        ]);
    }

    public function deactivated(): static
    {
        return $this->state(fn () => [
            'status' => PriceChangeLogStatus::DEACTIVATED,
            'new_price_member' => null,
            'new_price_vip' => null,
            'new_price_reseller' => null,
            'new_price_agent' => null,
            'reason' => 'SKU dinonaktifkan di provider — perlu perhatian admin.',
        ]);
    }

    public function negativeMargin(): static
    {
        return $this->state(fn () => [
            'status' => PriceChangeLogStatus::NEGATIVE_MARGIN,
            'new_price_member' => 9000,
            'reason' => 'Setelah markup & clamp, harga member masih di bawah modal.',
        ]);
    }
}
