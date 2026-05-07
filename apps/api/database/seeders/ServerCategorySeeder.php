<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServerCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $items = [
            // 🎮 Mobile Legends (Category ID: 1)
            ['id' => 1, 'category_id' => 1, 'name' => 'User ID', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'category_id' => 1, 'name' => 'Zone ID', 'created_at' => $now, 'updated_at' => $now], // ID 2 akan dipakai oleh ServerCategoryOptionSeeder

            // 🎮 Free Fire (Category ID: 3)
            ['id' => 3, 'category_id' => 3, 'name' => 'Player ID', 'created_at' => $now, 'updated_at' => $now],

            // 🎮 Valorant (Category ID: 9)
            ['id' => 4, 'category_id' => 9, 'name' => 'Riot ID', 'created_at' => $now, 'updated_at' => $now],

            // 📱 Pulsa Reguler (Category ID: 11)
            ['id' => 5, 'category_id' => 11, 'name' => 'Nomor HP', 'created_at' => $now, 'updated_at' => $now],

            // 🌐 Paket Data (Category ID: 12)
            ['id' => 6, 'category_id' => 12, 'name' => 'Nomor HP', 'created_at' => $now, 'updated_at' => $now],

            // 💸 E-Money (Category ID: 13)
            ['id' => 7, 'category_id' => 13, 'name' => 'Nomor HP', 'created_at' => $now, 'updated_at' => $now],

            // ⚡ PPOB / PLN / K-Vision (Category ID: 14)
            ['id' => 8, 'category_id' => 14, 'name' => 'Nomor Meter / ID Pelanggan', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('server_categories')->insert($items);
    }
}
