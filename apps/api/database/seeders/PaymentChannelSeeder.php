<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentChannelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        $channels = [
            [
                'name' => 'BCA Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'bca_va',
                'min_amount' => 10000,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Mandiri Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'mandiri_va',
                'min_amount' => 10000,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'BNI Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'bni_va',
                'min_amount' => 10000,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'BRI Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'bri_va',
                'min_amount' => 10000,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'QRIS (Gopay/OVO/Dana/LinkAja)',
                'payment_type' => 'qris',
                'channel_code' => 'qris',
                'min_amount' => 1000,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'GoPay',
                'payment_type' => 'ewallet',
                'channel_code' => 'gopay',
                'min_amount' => 1000,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'OVO',
                'payment_type' => 'ewallet',
                'channel_code' => 'ovo',
                'min_amount' => 1000,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'DANA',
                'payment_type' => 'ewallet',
                'channel_code' => 'dana',
                'min_amount' => 1000,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Alfamart',
                'payment_type' => 'convenience_store',
                'channel_code' => 'alfamart',
                'min_amount' => 20000,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('payment_channels')->upsert(
            $channels,
            ['channel_code'],
            ['name', 'payment_type', 'min_amount', 'is_active', 'updated_at']
        );
    }
}
