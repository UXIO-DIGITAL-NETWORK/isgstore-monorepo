<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentChannelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * `gateway_fee_flat` / `gateway_fee_percent` are Monetapay's fee kita pays per
     * transaction — flat (Rp) for VA/retail, percent for QRIS/e-wallet; a channel
     * uses one or the other. They feed `payments.gateway_fee` at checkout and drive
     * kita's profit (`amount_fee - gateway_fee`). `fee_flat`/`fee_percent` (kita's
     * own markup shown to payers) stay 0 here — that is a separate admin decision.
     */
    public function run(): void
    {
        $now = now();

        // name, payment_type, channel_code, min_amount, is_single_use, gateway_fee_flat, gateway_fee_percent
        $definitions = [
            // The internal wallet — CheckoutAction, RefundFailedTransactionAction and
            // ListPaymentChannelsAction all branch on this exact channel_code.
            ['Saldo (Wallet)', 'balance', 'balance', 0, false, 0, 0],

            // Virtual Account — flat gateway fee, no gateway percent.
            ['BCA Virtual Account', 'virtual_account', 'bca_va', 10000, true, 1500, 0],
            ['BRI Virtual Account', 'virtual_account', 'bri_va', 10000, true, 1500, 0],
            ['BNI Virtual Account', 'virtual_account', 'bni_va', 10000, true, 1500, 0],
            ['Mandiri Virtual Account', 'virtual_account', 'mandiri_va', 10000, true, 1900, 0],
            ['Permata Virtual Account', 'virtual_account', 'permata_va', 10000, true, 1500, 0],
            ['CIMB Virtual Account', 'virtual_account', 'cimb_va', 10000, true, 1500, 0],
            ['Danamon Virtual Account', 'virtual_account', 'danamon_va', 10000, true, 1500, 0],
            ['Bank Sahabat Sampoerna Virtual Account', 'virtual_account', 'bss_va', 10000, true, 1500, 0],

            // Modern retail — flat gateway fee.
            ['Indomaret', 'convenience_store', 'indomaret', 20000, true, 4300, 0],
            ['Alfamart', 'convenience_store', 'alfamart', 20000, true, 4300, 0],

            // QRIS / e-wallet — percent gateway fee, no flat.
            ['QRIS (Gopay/OVO/Dana/LinkAja)', 'qris', 'qris', 1000, true, 0, 0.7],
            ['GoPay', 'ewallet', 'gopay', 1000, true, 0, 0.7],
            ['OVO', 'ewallet', 'ovo', 1000, true, 0, 1.8],
            ['DANA', 'ewallet', 'dana', 1000, true, 0, 1.6],
            ['LinkAja', 'ewallet', 'linkaja', 1000, true, 0, 1.8],
            ['ShopeePay', 'ewallet', 'shopeepay', 1000, true, 0, 2.1],
        ];

        $channels = [];
        foreach ($definitions as [$name, $type, $code, $min, $singleUse, $gwFlat, $gwPercent]) {
            $channels[] = [
                'name' => $name,
                'payment_type' => $type,
                'channel_code' => $code,
                'min_amount' => $min,
                'is_active' => true,
                'is_single_use' => $singleUse,
                'gateway_fee_flat' => $gwFlat,
                'gateway_fee_percent' => $gwPercent,
                'extra_config' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Payment Link carries a bespoke extra_config the others don't.
        $channels[] = [
            'name' => 'Payment Link',
            'payment_type' => 'payment_link',
            'channel_code' => 'payment_link',
            'min_amount' => 1000,
            'is_active' => true,
            'is_single_use' => false,
            'gateway_fee_flat' => 0,
            'gateway_fee_percent' => 0,
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
        ];

        DB::table('payment_channels')->upsert(
            $channels,
            ['channel_code'],
            ['name', 'payment_type', 'min_amount', 'is_active', 'is_single_use', 'gateway_fee_flat', 'gateway_fee_percent', 'extra_config', 'updated_at']
        );
    }
}
