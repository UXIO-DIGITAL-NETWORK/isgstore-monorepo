<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $products = [];

        // Helper: tiered pricing – modal is base, member +20%, vip +15%, reseller +10%, agent +5%
        $p = function ($catId, $subCatId, $name, $code, $modal) use (&$products, $now) {
            $products[] = [
                'category_id' => $catId,
                'sub_category_id' => $subCatId,
                'name' => $name,
                'code' => $code, // Ini adalah buyer_sku_code
                'price_modal' => $modal,
                'price_member' => (int) ($modal * 1.20),
                'price_vip' => (int) ($modal * 1.15),
                'price_reseller' => (int) ($modal * 1.10),
                'price_agent' => (int) ($modal * 1.05),
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        };

        // GAMES
        $p(1, 1, 'MOBILELEGEND - 5 Diamond', 'ml5', 1375);
        $p(1, 1, 'MOBILELEGEND - 10 Diamond', 'ml10', 2855);
        $p(1, 1, 'MOBILELEGEND - 12 Diamond', 'ml12', 3303);
        $p(1, 2, 'MOBILE LEGENDS Weekly Diamond Pass', 'mlweek', 27997);
        $p(3, 8, 'Free Fire 12 Diamond', 'ff12', 1811);
        $p(3, 8, 'Free Fire 50 Diamond', 'ff50', 6330);
        $p(3, 8, 'Free Fire 70 Diamond', 'ff70', 8955);
        $p(3, 8, 'Free Fire 140 Diamond', 'ff140', 18212);
        $p(3, 8, 'Free Fire 355 Diamond', 'ff355', 44800);
        $p(9, 14, 'Valorant 475 VP', 'val475', 52140);

        foreach (array_chunk($products, 100) as $chunk) {
            DB::table('products')->insert($chunk);
        }
    }
}
