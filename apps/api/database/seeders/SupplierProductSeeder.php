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
        $items = [];

        // Ambil semua produk yang baru saja di-seed
        $products = Product::all();

        foreach ($products as $product) {
            $items[] = [
                'product_id' => $product->id,
                // Karena data JSON murni dari Digiflazz, kita assign ke supplier 1
                'supplier_id' => 1,
                // buyer_sku_code diisi otomatis menggunakan property code produk
                'buyer_sku_code' => $product->code,
                'price' => $product->price_modal,
                'buyer_product_status' => true,
                'seller_product_status' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Insert menggunakan chunk agar tidak membebani memory
        foreach (array_chunk($items, 100) as $chunk) {
            DB::table('supplier_products')->insert($chunk);
        }
    }
}
