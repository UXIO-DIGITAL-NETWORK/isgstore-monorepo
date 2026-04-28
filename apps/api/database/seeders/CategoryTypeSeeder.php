<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoryTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Mobile Game',  'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'PC Game',      'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Console',      'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Voucher',      'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'E-Wallet',     'status' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('category_types')->insert($types);
    }
}
