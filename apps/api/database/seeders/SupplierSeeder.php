<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            ['name' => 'Digiflazz',       'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'VIP Reseller',     'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Internal System',  'status' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('suppliers')->insert($suppliers);
    }
}
