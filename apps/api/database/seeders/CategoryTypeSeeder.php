<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoryTypeSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        // `is_voucher` marks a type whose products are voucher/digital codes
        // (drives the admin's Category Type "Voucher" column). Game types are false.
        // This is a game top-up platform, so the taxonomy is game-focused.
        $types = [
            ['id' => 1, 'name' => 'Mobile Game', 'is_voucher' => false, 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'name' => 'PC Game',     'is_voucher' => false, 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'name' => 'Console',     'is_voucher' => false, 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 4, 'name' => 'Voucher',     'is_voucher' => true,  'status' => true, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('category_types')->insert($types);
    }
}
