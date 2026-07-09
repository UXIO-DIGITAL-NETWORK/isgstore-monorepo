<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $items = [];

        // Semua kategori produk dari price-list.json diarahkan ke Digiflazz (supplier_id = 1)
        $digiflazzCategories = [
            1 => 'mlbb',
            3 => 'freefire',
            9 => 'valorant',
            11 => 'pulsa',
            12 => 'data',
            13 => 'emoney',
            14 => 'ppob',
        ];

        foreach ($digiflazzCategories as $catId => $code) {
            $items[] = [
                'category_id' => $catId,
                'supplier_id' => 1,
                'template_code' => $code,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('supplier_categories')->insert($items);
    }
}
