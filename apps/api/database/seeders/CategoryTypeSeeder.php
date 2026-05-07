<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoryTypeSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $types = [
            ['id' => 1, 'name' => 'Mobile Game',  'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'name' => 'PC Game',      'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'name' => 'Console',      'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'name' => 'Voucher',      'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 5, 'name' => 'E-Wallet',     'status' => true, 'created_at' => $now, 'updated_at' => $now],
            // Tambahan tipe baru untuk mengakomodasi data dari price-list.json Digiflazz
            ['id' => 6, 'name' => 'Pulsa & Data', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 7, 'name' => 'PPOB',         'status' => true, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('category_types')->insert($types);
    }
}
