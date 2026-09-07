<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Member', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'VIP', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Reseller', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Agent', 'created_at' => now(), 'updated_at' => now()],
            // Payment-page roles. Names map to RoleType::PAYMENT_INTERNAL ("kita")
            // and RoleType::PAYMENT_ADMIN ("client"); the middleware matches on the
            // lower-cased name, so it must equal the enum value exactly.
            ['name' => 'Payment-Internal', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Payment-Admin', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('roles')->insert($roles);
    }
}
