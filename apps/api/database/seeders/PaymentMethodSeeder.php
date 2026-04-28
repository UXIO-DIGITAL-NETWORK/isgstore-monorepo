<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['name' => 'BCA Virtual Account',  'code' => 'bca_va',   'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'BNI Virtual Account',   'code' => 'bni_va',   'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'BRI Virtual Account',   'code' => 'bri_va',   'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Mandiri Virtual Account','code' => 'mandiri_va','is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'OVO',                   'code' => 'ovo',      'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'GoPay',                 'code' => 'gopay',    'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'DANA',                  'code' => 'dana',     'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'ShopeePay',             'code' => 'shopeepay','is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'QRIS',                  'code' => 'qris',    'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Alfamart',              'code' => 'alfamart', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Indomaret',             'code' => 'indomaret','is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'System Balance',        'code' => 'balance',  'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('payment_methods')->insert($methods);
    }
}
