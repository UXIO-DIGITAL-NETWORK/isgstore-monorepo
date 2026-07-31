<?php

namespace Database\Seeders;

use App\Models\FlashSale;
use App\Models\FlashSaleItem;
use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * One running flash sale so the homepage block has real data.
 *
 * The window is relative to seed time rather than a fixed date — a hardcoded
 * window would expire and the block would render empty the next time anyone
 * looked at it.
 */
class FlashSaleSeeder extends Seeder
{
    public function run(): void
    {
        $sale = FlashSale::updateOrCreate(
            ['name' => 'Flash Sale Mingguan'],
            [
                'starts_at' => now()->subHours(2),
                'ends_at' => now()->addDays(2),
                'is_active' => true,
            ],
        );

        // Seeded against whatever the catalogue actually holds, so the seeder
        // cannot fail on a database whose products differ.
        $products = Product::where('status', true)->inRandomOrder()->limit(5)->get();

        if ($products->isEmpty()) {
            return;
        }

        foreach ($products as $index => $product) {
            $salePrice = (int) round($product->price_member * 0.85);

            FlashSaleItem::updateOrCreate(
                ['flash_sale_id' => $sale->id, 'product_id' => $product->id],
                [
                    // Never below cost — a seeded sale that loses money on
                    // every order would be a strange default to ship.
                    'sale_price' => max($salePrice, (int) $product->price_modal),
                    'stock_total' => 100,
                    'stock_sold' => 20 + ($index * 7),
                    'sort_order' => $index,
                ],
            );
        }
    }
}
