<?php

namespace Database\Seeders;

use App\Enums\ServiceCategory;
use App\Models\PaymentChannel;
use App\Models\Service;
use Illuminate\Database\Seeder;

/**
 * The services kita sells to its payment-page clients.
 *
 * Keyed on `code` via updateOrCreate so a re-seed repoints nothing: existing
 * invoices and subscriptions hold a service_id, and creating duplicates would
 * orphan them.
 */
class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        // Ties "Monetapay the service" to "Monetapay the channel", so the
        // status page can inherit the channel's on/off flag.
        $monetapayChannelId = PaymentChannel::query()
            ->where('channel_code', 'like', '%monetapay%')
            ->value('id');

        $services = [
            [
                'code' => 'digiflazz',
                'name' => 'Digiflazz',
                'category' => ServiceCategory::SUPPLIER->value,
                'description' => 'Integrasi supplier produk digital: sinkronisasi harga, stok, dan callback transaksi.',
                'features' => ['Sinkronisasi harga otomatis', 'Callback status transaksi', 'Cek & bayar tagihan pascabayar'],
                'price' => 250000,
                'duration_days' => 30,
                'payment_channel_id' => null,
                'sort_order' => 1,
            ],
            [
                'code' => 'monetapay',
                'name' => 'Monetapay',
                'category' => ServiceCategory::PAYMENT_GATEWAY->value,
                'description' => 'Payment gateway: Virtual Account, QRIS, dan e-wallet beserta disbursement.',
                'features' => ['Virtual Account', 'QRIS', 'E-wallet', 'Disbursement'],
                'price' => 500000,
                'duration_days' => 30,
                'payment_channel_id' => $monetapayChannelId,
                'sort_order' => 2,
            ],
            [
                'code' => 'email-service',
                'name' => 'Email Service',
                'category' => ServiceCategory::COMMUNICATION->value,
                'description' => 'Pengiriman email transaksional: struk pembelian dan notifikasi ke pelanggan.',
                'features' => ['Struk transaksi', 'Notifikasi status pesanan', 'Domain pengirim khusus'],
                'price' => 150000,
                'duration_days' => 30,
                'payment_channel_id' => null,
                'sort_order' => 3,
            ],
            [
                'code' => 'domain',
                'name' => 'Domain',
                'category' => ServiceCategory::INFRASTRUCTURE->value,
                'description' => 'Pengelolaan domain dan SSL untuk website topup Anda.',
                'features' => ['Perpanjangan domain', 'Sertifikat SSL', 'Pengaturan DNS'],
                'price' => 200000,
                'duration_days' => 365,
                'payment_channel_id' => null,
                'sort_order' => 4,
            ],
            [
                'code' => 'whatsapp-api',
                'name' => 'WhatsApp API',
                'category' => ServiceCategory::COMMUNICATION->value,
                'description' => 'Notifikasi WhatsApp untuk status pesanan dan pesan ke pelanggan.',
                'features' => ['Notifikasi status pesanan', 'Blast pesan', 'Nomor pengirim khusus'],
                'price' => 300000,
                'duration_days' => 30,
                'payment_channel_id' => null,
                'sort_order' => 5,
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(
                ['code' => $service['code']],
                $service + ['is_active' => true],
            );
        }
    }
}
