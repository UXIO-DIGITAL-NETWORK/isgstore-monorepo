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
                // The internal wallet. CheckoutAction, RefundFailedTransactionAction
                // and ListPaymentChannelsAction all branch on this exact
                // channel_code, so without the row the wallet can never be used
                // to pay — the code paths existed with nothing to trigger them.
                'name' => 'Saldo (Wallet)',
                'payment_type' => 'balance',
                'channel_code' => 'balance',
                'min_amount' => 0,
                'is_active' => true,
                'is_single_use' => false,
                // fee_flat / fee_percent are omitted deliberately: this is a
                // bulk upsert, so every row must carry the same column list,
                // and the wallet's zero fees are the table defaults anyway.
                'extra_config' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'BCA Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'bca_va',
                'min_amount' => 10000,
                'is_active' => true,
                'is_single_use' => true,
                'extra_config' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Mandiri Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'mandiri_va',
                'min_amount' => 10000,
                'is_active' => true,
                'is_single_use' => true,
                'extra_config' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'BNI Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'bni_va',
                'min_amount' => 10000,
                'is_active' => true,
                'is_single_use' => true,
                'extra_config' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'BRI Virtual Account',
                'payment_type' => 'virtual_account',
                'channel_code' => 'bri_va',
                'min_amount' => 10000,
                'is_active' => true,
                'is_single_use' => true,
                'extra_config' => null,
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
                'extra_config' => null,
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
                'extra_config' => null,
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
                'extra_config' => null,
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
                'extra_config' => null,
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
                'extra_config' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            [
                'name' => 'Payment Link',
                'payment_type' => 'payment_link',
                'channel_code' => 'payment_link',
                'min_amount' => 1000,
                'is_active' => true,
                'is_single_use' => false,
                'extra_config' => json_encode([
                    'regular_bank_codes' => 'BNI,PERMATA',
                    'ewallet_bank_codes' => 'DANA,OVO,LINKAJA',
                    'qris_bank_code' => 'QRIS',
                    'terminal_type' => 'WAP',
                    'fixed_bank_code' => '0',
                    'account_bank_code' => '',
                    'sender_name' => 'Uxio',
                ]),
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('payment_channels')->upsert(
            $channels,
            ['channel_code'],
            ['name', 'payment_type', 'min_amount', 'is_active', 'is_single_use', 'extra_config', 'updated_at']
        );
    }
}
