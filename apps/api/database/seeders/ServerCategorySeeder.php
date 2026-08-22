<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServerCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        // Games only.
        $items = [
            // 🎮 Mobile Legends (Category ID: 1)
            ['id' => 1, 'category_id' => 1, 'name' => 'User ID', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'category_id' => 1, 'name' => 'Zone ID', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('server_categories')->insert($items);
    }
}
