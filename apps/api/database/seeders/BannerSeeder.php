<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BannerSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $banners = [
            ['category_id' => null, 'name' => 'Promo Ramadan 2026', 'image_path' => '/banners/ramadan-2026.jpg', 'link' => 'https://uxio.id/promo/ramadan', 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => null, 'name' => 'Flash Sale Weekend', 'image_path' => '/banners/flash-sale.jpg', 'link' => 'https://uxio.id/flash-sale', 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => null, 'name' => 'Referral Bonus 50%', 'image_path' => '/banners/referral.jpg', 'link' => 'https://uxio.id/referral', 'created_at' => $now, 'updated_at' => $now],

            // Kategori Game yang Valid (1: MLBB) — hanya Mobile Legends yang di-seed.
            ['category_id' => null, 'name' => 'MLBB New Skin Release', 'image_path' => '/banners/mlbb-skin.jpg', 'link' => 'https://uxio.id/mlbb/new-skin', 'created_at' => $now, 'updated_at' => $now],

            // Kategori game selain MLBB belum di-seed → category_id null (banner umum).
            ['category_id' => null, 'name' => 'Free Fire OB48', 'image_path' => '/banners/ff-ob48.jpg', 'link' => null, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => null, 'name' => 'Valorant Champions 2026', 'image_path' => '/banners/val-champs.jpg', 'link' => 'https://uxio.id/valorant/champs', 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => null, 'name' => 'Genshin 5.0 Update', 'image_path' => '/banners/genshin-50.jpg', 'link' => 'https://uxio.id/genshin/update', 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => null, 'name' => 'PUBG Mobile x Dragon Ball', 'image_path' => '/banners/pubg-db.jpg', 'link' => null, 'created_at' => $now, 'updated_at' => $now],

            ['category_id' => null, 'name' => 'Hari Kemerdekaan Promo', 'image_path' => '/banners/hut-ri.jpg', 'link' => 'https://uxio.id/promo/17agustus', 'created_at' => $now, 'updated_at' => $now],

            // Promo umum (bukan kategori game) — tanpa tautan kategori.
            ['category_id' => null, 'name' => 'Cashback 20% All E-Wallet', 'image_path' => '/banners/cashback-ewallet.jpg', 'link' => 'https://uxio.id/promo/cashback', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('banners')->insert($banners);
    }
}
