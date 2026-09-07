<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierProductSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Cost + availability live in ProductSeeder::services() (single source of
        // truth), keyed by service id = product code = buyer_sku_code.
        $byCode = collect(ProductSeeder::services())->keyBy('id');

        $items = [];
        foreach (Product::all() as $product) {
            $service = $byCode->get($product->code);
            $available = (bool) ($service['available'] ?? true);

            $items[] = [
                'product_id' => $product->id,
                'supplier_id' => 1, // Uxiolabs
                'buyer_sku_code' => $product->code, // uxiolabs service id
                'price' => $service['cost'] ?? $product->price_modal,
                // uxiolabs "Unavailable" ⇒ seeded inactive; the 5-minute price
                // checker flips it back on when the service returns to "aktif".
                'buyer_product_status' => $available,
                'seller_product_status' => $available,
                'is_active' => $available,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($items, 100) as $chunk) {
            DB::table('supplier_products')->insert($chunk);
        }
    }
}
