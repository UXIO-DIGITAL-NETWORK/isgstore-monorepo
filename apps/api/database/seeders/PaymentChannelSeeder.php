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
                'is_single_use' => true,   // dynamic VA
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Mandiri Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'mandiri_va',
                'min_amount' => 10000,
                'is_active' => true,
                'is_single_use' => true,   // dynamic VA
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'BNI Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'bni_va',
                'min_amount' => 10000,
                'is_active' => true,
                'is_single_use' => true,   // dynamic VA
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'BRI Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'bri_va',
                'min_amount' => 10000,
                'is_active' => true,
                'is_single_use' => true,   // dynamic VA
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'QRIS (Gopay/OVO/Dana/LinkAja)',
                'payment_type' => 'qris',
                'channel_code' => 'qris',
                'min_amount' => 1000,
                'is_active' => true,
                'is_single_use' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'GoPay',
                'payment_type' => 'ewallet',
                'channel_code' => 'gopay',
                'min_amount' => 1000,
                'is_active' => true,
                'is_single_use' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'OVO',
                'payment_type' => 'ewallet',
                'channel_code' => 'ovo',
                'min_amount' => 1000,
                'is_active' => true,
                'is_single_use' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'DANA',
                'payment_type' => 'ewallet',
                'channel_code' => 'dana',
                'min_amount' => 1000,
                'is_active' => true,
                'is_single_use' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Alfamart',
                'payment_type' => 'convenience_store',
                'channel_code' => 'alfamart',
                'min_amount' => 20000,
                'is_active' => true,
                'is_single_use' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // SIT-only channels: produce specific account_bank_code values / is_single_use states
            // to trigger Monetapay error scenarios 2.2 (static VA), 2.3 (4012), 2.4 (7003).
            // Order matters for auto-increment on fresh DBs: test_va=10, bnc_va=11, bni_va_s=12.
            // Set is_active = false before deploying to production.
            [
                'name' => '[SIT] Invalid Bank Code',
                'payment_type' => 'virtual_account',
                'channel_code' => 'test_va',
                'min_amount' => 10000,
                'is_active' => true,
                'is_single_use' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => '[SIT] BNC Bank Error',
                'payment_type' => 'virtual_account',
                'channel_code' => 'bnc_va',
                'min_amount' => 10000,
                'is_active' => true,
                'is_single_use' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => '[SIT] BNI Static VA',
                'payment_type' => 'virtual_account',
                'channel_code' => 'bni_va_s',
                'min_amount' => 10000,
                'is_active' => true,
                'is_single_use' => false,   // static VA (is_single_use=0) for scenario 2.2
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('payment_channels')->upsert(
            $channels,
            ['channel_code'],
            ['name', 'payment_type', 'min_amount', 'is_active', 'is_single_use', 'updated_at']
        );
    }
}
