<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SubCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $subs = [
            // Games
            ['id' => 1, 'category_id' => 1, 'name' => 'Diamond', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'category_id' => 1, 'name' => 'Membership', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 8, 'category_id' => 3, 'name' => 'Diamond', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 14, 'category_id' => 9, 'name' => 'Valorant Points', 'status' => true, 'created_at' => $now, 'updated_at' => $now],

            // Pulsa (Cat: 11)
            ['id' => 30, 'category_id' => 11, 'name' => 'Axis & by.U', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 32, 'category_id' => 11, 'name' => 'Indosat', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 33, 'category_id' => 11, 'name' => 'Telkomsel', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 34, 'category_id' => 11, 'name' => 'Smartfren', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 35, 'category_id' => 11, 'name' => 'Tri', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 36, 'category_id' => 11, 'name' => 'XL', 'status' => true, 'created_at' => $now, 'updated_at' => $now],

            // Data (Cat: 12)
            ['id' => 40, 'category_id' => 12, 'name' => 'Axis Data', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 41, 'category_id' => 12, 'name' => 'Indosat Data', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 42, 'category_id' => 12, 'name' => 'Telkomsel Data', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 43, 'category_id' => 12, 'name' => 'XL Data', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 44, 'category_id' => 12, 'name' => 'Tri Data', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 45, 'category_id' => 12, 'name' => 'Smartfren Data', 'status' => true, 'created_at' => $now, 'updated_at' => $now],

            // E-Money (Cat: 13)
            ['id' => 50, 'category_id' => 13, 'name' => 'DANA', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 51, 'category_id' => 13, 'name' => 'GoPay', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 52, 'category_id' => 13, 'name' => 'OVO', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 53, 'category_id' => 13, 'name' => 'ShopeePay', 'status' => true, 'created_at' => $now, 'updated_at' => $now],

            // PPOB (Cat: 14)
            ['id' => 60, 'category_id' => 14, 'name' => 'Token PLN', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 61, 'category_id' => 14, 'name' => 'TV & Gas', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 62, 'category_id' => 14, 'name' => 'Paket Telepon', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 63, 'category_id' => 14, 'name' => 'Masa Aktif & Perdana', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 64, 'category_id' => 14, 'name' => 'Voucher Fisik', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('sub_categories')->insert($subs);
    }
}
