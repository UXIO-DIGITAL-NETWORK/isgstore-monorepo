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

        // Our category id => the provider's own `kategori` string. This mapping is
        // what decides which uxiolabs SKUs are offered for the category.
        $uxiolabsCategories = [
            1 => 'Mobile Legends',
        ];

        foreach ($uxiolabsCategories as $catId => $code) {
            $items[] = [
                'category_id' => $catId,
                'supplier_id' => 1,
                'provider_category' => $code,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('supplier_categories')->insert($items);
    }
}
