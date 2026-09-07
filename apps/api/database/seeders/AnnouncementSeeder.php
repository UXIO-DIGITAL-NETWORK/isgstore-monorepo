<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $items = [
            ['category_id' => null, 'content' => 'Server maintenance terjadwal pada hari Minggu, 27 April 2026, pukul 00:00 - 02:00 WIB. Mohon maaf atas ketidaknyamanannya.', 'image_path' => null, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => null, 'content' => 'Selamat datang di Uxio Digital Network! Platform top-up game & voucher terpercaya dengan harga terbaik.', 'image_path' => '/announcements/welcome.jpg', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],

            // Kategori Game yang Valid (1: MLBB)
            ['category_id' => null, 'content' => 'Promo spesial MLBB! Diskon 10% untuk pembelian Diamond 240 ke atas. Berlaku hingga 30 April 2026.', 'image_path' => '/announcements/mlbb-promo.jpg', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],

            // Diubah menjadi null karena kategori Genshin sudah tidak aktif
            ['category_id' => null, 'content' => 'Genshin Impact versi 5.0 sudah rilis! Top up Genesis Crystal sekarang dan dapatkan bonus 10%.', 'image_path' => '/announcements/genshin-50.jpg', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],

            ['category_id' => null, 'content' => 'Pembayaran via QRIS sekarang tersedia! Bayar lebih mudah dengan scan QR dari aplikasi e-wallet favoritmu.', 'image_path' => null, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => null, 'content' => 'Flash Sale setiap Jumat malam! Diskon hingga 15% untuk semua produk. Jangan sampai kelewatan!', 'image_path' => '/announcements/flash-friday.jpg', 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],

            // Valorant belum di-seed sebagai kategori → category_id null (pengumuman umum).
            ['category_id' => null, 'content' => 'Valorant Champions Tour 2026 segera hadir! Top up VP untuk beli skin eksklusif Champions Bundle.', 'image_path' => null, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],

            ['category_id' => null, 'content' => 'Sistem poin loyalitas sudah aktif! Setiap pembelian Rp 10.000 mendapatkan 1 poin. Tukarkan poinmu dengan diskon menarik.', 'image_path' => null, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('announcements')->insert($items);
    }
}
