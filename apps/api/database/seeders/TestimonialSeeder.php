<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

/**
 * Curated marketing testimonials. Distinct from `ratings`, which are real
 * purchase-linked reviews — these are editorial and carry no transaction.
 */
class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        $testimonials = [
            ['Rizky Pratama', 'Mobile Legends Player', 'Top up diamond selalu masuk kurang dari satu menit. Harganya juga paling murah dibanding tempat lain.', 5, 'Mobile Legends', true],
            ['Siti Nurhaliza', 'Free Fire Player', 'Sudah langganan hampir setahun. Belum pernah ada masalah, CS-nya juga responsif kalau ditanya.', 5, 'Free Fire', true],
            ['Andi Wijaya', 'PUBG Mobile Player', 'Awalnya ragu top up tanpa login, ternyata cukup masukkan ID dan nomor WA. Prosesnya gampang banget.', 5, 'PUBG Mobile', true],
            ['Dewi Lestari', 'Honor of Kings Player', 'Metode pembayarannya lengkap, bisa pakai QRIS maupun e-wallet. Praktis buat yang buru-buru.', 4, 'Honor of Kings', false],
            ['Bagus Setiawan', 'Valorant Player', 'Harga VP di sini stabil dan sering ada promo. Sudah beberapa kali dapat cashback.', 5, 'Valorant', false],
            ['Maya Anggraini', 'Genshin Impact Player', 'Suka karena riwayat transaksinya rapi. Gampang cek pesanan lama kalau perlu bukti.', 4, 'Genshin Impact', false],
        ];

        foreach ($testimonials as $index => [$name, $title, $content, $rating, $game, $featured]) {
            Testimonial::updateOrCreate(
                ['author_name' => $name],
                [
                    'author_title' => $title,
                    'content' => $content,
                    'rating' => $rating,
                    'game_name' => $game,
                    'is_featured' => $featured,
                    'sort_order' => $index,
                    'is_active' => true,
                ],
            );
        }
    }
}
