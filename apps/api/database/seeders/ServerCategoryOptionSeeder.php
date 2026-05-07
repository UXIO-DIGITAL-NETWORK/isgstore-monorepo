<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServerCategoryOptionSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $options = [
            // MLBB Zone ID options (Asumsi server_category_id untuk MLBB Zone = 2)
            ['server_category_id' => 2, 'name' => 'Zone 1', 'value' => '2001', 'created_at' => $now, 'updated_at' => $now],
            ['server_category_id' => 2, 'name' => 'Zone 2', 'value' => '2002', 'created_at' => $now, 'updated_at' => $now],
            ['server_category_id' => 2, 'name' => 'Zone 3', 'value' => '2003', 'created_at' => $now, 'updated_at' => $now],
            ['server_category_id' => 2, 'name' => 'Zone 4', 'value' => '2004', 'created_at' => $now, 'updated_at' => $now],
            ['server_category_id' => 2, 'name' => 'Zone 5', 'value' => '2005', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('server_category_options')->insert($options);
    }
}
