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

        // Game categories mapped to Digiflazz (supplier_id = 1).
        $digiflazzCategories = [
            1 => 'mlbb',
            3 => 'freefire',
            9 => 'valorant',
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
