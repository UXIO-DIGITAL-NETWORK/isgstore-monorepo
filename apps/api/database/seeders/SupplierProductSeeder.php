<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Product;

class SupplierProductSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $items = [];

        // Map every product to supplier based on its category's supplier
        $products = Product::all();
        foreach ($products as $product) {
            // Categories 1-12 → Digiflazz (supplier 1)
            // Categories 13-15 → Digiflazz (supplier 1)
            // Categories 16-19 → VIP Reseller (supplier 2)
            // Categories 20-25 → Internal System (supplier 3)
            $supplierId = match (true) {
                $product->category_id <= 15 => 1,
                $product->category_id <= 19 => 2,
                default => 3,
            };

            $items[] = [
                'product_id'             => $product->id,
                'supplier_id'            => $supplierId,
                'buyer_sku_code'         => strtolower($product->code),
                'price'                  => $product->price_modal,
                'buyer_product_status'   => true,
                'seller_product_status'  => true,
                'is_active'              => true,
                'created_at'             => $now,
                'updated_at'             => $now,
            ];
        }

        DB::table('supplier_products')->insert($items);
    }
}
