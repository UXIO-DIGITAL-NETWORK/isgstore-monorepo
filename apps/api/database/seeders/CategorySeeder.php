<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $categories = [
            // Games
            ['id' => 1, 'type_id' => 1, 'name' => 'Mobile Legends', 'code' => 'mlbb', 'validasi_nickname' => null, 'region' => 'ID', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'type_id' => 1, 'name' => 'Free Fire', 'code' => 'freefire', 'validasi_nickname' => null, 'region' => 'ID', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 9, 'type_id' => 2, 'name' => 'Valorant', 'code' => 'valorant', 'validasi_nickname' => null, 'region' => 'AP', 'status' => true, 'created_at' => $now, 'updated_at' => $now],

            // Pulsa & PPOB
            ['id' => 11, 'type_id' => 6, 'name' => 'Pulsa Reguler', 'code' => 'pulsa', 'validasi_nickname' => null, 'region' => 'ID', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 12, 'type_id' => 6, 'name' => 'Paket Data / Internet', 'code' => 'data', 'validasi_nickname' => null, 'region' => 'ID', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 13, 'type_id' => 5, 'name' => 'E-Money / Dompet Digital', 'code' => 'emoney', 'validasi_nickname' => null, 'region' => 'ID', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 14, 'type_id' => 7, 'name' => 'PPOB & Hiburan', 'code' => 'ppob', 'validasi_nickname' => null, 'region' => 'ID', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('categories')->insert($categories);
    }
}
