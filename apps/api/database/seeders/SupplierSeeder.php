<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $suppliers = [
            ['id' => 1, 'name' => 'Digiflazz',       'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'name' => 'VIP Reseller',    'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'name' => 'Internal System', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('suppliers')->insert($suppliers);
    }
}
