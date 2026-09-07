<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\ArticleCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Editorial content mirroring what the storefront previously shipped as a
 * bundled fixture, so the news pages look identical once they read the API.
 *
 * `category_label` is set only where the badge differs from the pill the
 * article files under — PUBG Mobile articles sit in the "Lainnya" (other)
 * pill but still badge as PUBG MOBILE.
 */
class ArticleSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'key' => 'promo',
                'name' => 'Promo',
                'sort_order' => 0,
            ],
            [
                'key' => 'mobile-legend',
                'name' => 'Mobile Legend',
                'sort_order' => 1,
            ],
            [
                'key' => 'free-fire',
                'name' => 'Free Fire',
                'sort_order' => 2,
            ],
            [
                'key' => 'honor-of-kings',
                'name' => 'Honor of Kings',
                'sort_order' => 3,
            ],
            [
                'key' => 'valorant',
                'name' => 'Valorant',
                'sort_order' => 4,
            ],
            [
                'key' => 'lainnya',
                'name' => 'Lainnya',
                'sort_order' => 5,
            ],
        ];

        foreach ($categories as $category) {
            ArticleCategory::updateOrCreate(
                ['key' => $category['key']],
                ['name' => $category['name'], 'sort_order' => $category['sort_order'], 'status' => true],
            );
        }

        $categoryIds = ArticleCategory::pluck('id', 'key');

        $body = [
            [
                'paragraphs' => [
                    'Bagi para gamer, top up sudah menjadi bagian penting untuk mendapatkan item, skin, diamond, UC, atau berbagai kebutuhan dalam game. Namun, tidak sedikit pemain yang masih membayar lebih mahal karena kurang mengetahui cara mendapatkan harga terbaik saat melakukan top up. Kabar baiknya, ada beberapa tips sederhana yang bisa membantu Anda berhemat tanpa mengorbankan keamanan dan kecepatan transaksi.',
                ],
            ],
            [
                'heading' => 'Pilih Platform Top Up yang Terpercaya',
                'paragraphs' => [
                    'Langkah pertama adalah menggunakan platform top up yang terpercaya. Selain menjamin keamanan transaksi, platform yang baik biasanya menawarkan harga yang kompetitif dan proses otomatis yang lebih cepat. Hindari menggunakan layanan yang tidak jelas, hanya karena menawarkan harga sangat murah, karena berisiko menyebabkan transaksi gagal atau bahkan merugikan akun Anda.',
                ],
            ],
            [
                'heading' => 'Bandingkan Harga Sebelum Membeli',
                'paragraphs' => [
                    'Sebelum melakukan top up, luangkan waktu untuk membandingkan harga dari beberapa penyedia layanan. Perbedaan harga mungkin terlihat kecil, tetapi jika dilakukan secara rutin, selisih tersebut bisa menjadi cukup signifikan. Pastikan juga untuk memperhatikan jumlah item yang didapat agar tidak salah membandingkan penawaran.',
                ],
            ],
            [
                'heading' => 'Manfaatkan Promo dan Diskon',
                'paragraphs' => [
                    'Banyak platform top up memberikan promo harian, diskon khusus, atau cashback pada periode tertentu. Dengan memanfaatkan promo ini, Anda bisa mendapatkan lebih banyak item dengan biaya yang lebih hemat. Jangan lupa untuk mengikuti informasi promo terbaru agar tidak ketinggalan penawaran menarik.',
                    'Gunakan Metode Pembayaran yang Tepat. Platform pembayaran sering kali menawarkan keuntungan tambahan seperti cashback, potongan harga, atau poin reward. E-wallet, QRIS, dan pembayaran digital lainnya kerap menghadirkan promo yang dapat membantu mengurangi total biaya top up.',
                ],
            ],
            [
                'heading' => 'Top Up Sesuai Kebutuhan',
                'paragraphs' => [
                    'Membeli dalam jumlah besar memang terlihat lebih menguntungkan, tetapi belum tentu sesuai dengan kebutuhan Anda. Pilih nominal yang benar-benar diperlukan agar pengeluaran tetap terkontrol dan lebih efisien.',
                    'Perhatikan Kecepatan Proses. Harga murah memang penting, tetapi kecepatan transaksi juga tidak kalah penting. Pilih layanan yang memiliki sistem otomatis sehingga item yang dibeli dapat langsung masuk ke akun dalam hitungan detik tanpa harus menunggu lama.',
                ],
            ],
            [
                'heading' => 'Kesimpulan',
                'paragraphs' => [
                    'Mendapatkan harga top up game yang murah bukan hal yang paling menyenangkan, tetapi juga mempertimbangkan keamanan, kecepatan, dan kualitas layanan. Dengan memilih platform terpercaya, memanfaatkan promo, serta menggunakan metode pembayaran yang tepat, Anda bisa menikmati pengalaman top up yang lebih hemat dan nyaman setiap hari.',
                    'Jadi, sebelum melakukan top up berikutnya, pastikan Anda sudah membandingkan harga dan memanfaatkan promo yang tersedia agar mendapatkan nilai terbaik untuk setiap transaksi.',
                ],
            ],
        ];

        $articles = [
            [
                'slug' => 'cara-top-up-diamond-lebih-hemat',
                'category_key' => 'mobile-legend',
                'title' => 'Cara Top Up Diamond Lebih Hemat + Tips Dapat Bonus Diamond Gratis',
                'published_at' => '2026-05-01 09:00:00',
            ],
            [
                'slug' => 'top-up-murah-cepat-harga-terbaik-uc',
                'category_key' => 'lainnya',
                'title' => 'Top Up Murah & Cepat, Ini Cara Dapat Harga Terbaik untuk UC',
                'published_at' => '2026-04-28 09:00:00',
                'category_label' => 'PUBG Mobile',
            ],
            [
                'slug' => 'panduan-top-up-uc-aman-instan',
                'category_key' => 'free-fire',
                'title' => 'Panduan Top Up UC Aman dan Instan untuk Pemain Baru & Pro',
                'published_at' => '2026-04-12 09:00:00',
            ],
            [
                'slug' => 'top-up-murah-cepat-honor-of-kings',
                'category_key' => 'honor-of-kings',
                'title' => 'Top Up Murah & Cepat, Ini Cara Dapat Harga Terbaik di Honor of Kings',
                'published_at' => '2026-04-28 09:00:00',
                'category_label' => 'Honor Of Kings',
            ],
            [
                'slug' => 'panduan-top-up-diamond-aman-instan',
                'category_key' => 'mobile-legend',
                'title' => 'Panduan Top Up Diamond Aman dan Instan untuk Pemain Baru & Pro',
                'published_at' => '2026-04-12 09:00:00',
            ],
            [
                'slug' => 'top-up-murah-cepat-valorant',
                'category_key' => 'valorant',
                'title' => 'Top Up Murah & Cepat, Ini Cara Dapat Harga Terbaik di Valorant',
                'published_at' => '2026-04-28 09:00:00',
            ],
            [
                'slug' => 'top-up-murah-cepat-uc-pubg',
                'category_key' => 'lainnya',
                'title' => 'Top Up Murah & Cepat, Ini Cara Dapat Harga Terbaik untuk UC',
                'published_at' => '2026-04-28 09:00:00',
                'category_label' => 'PUBG Mobile',
            ],
            [
                'slug' => 'promo-spesial-hari-raya-bonus-50',
                'category_key' => 'promo',
                'title' => 'Promo Spesial Hari Raya: Dapatkan Bonus Top Up Hingga 50%',
                'published_at' => '2026-04-28 09:00:00',
            ],
            [
                'slug' => 'top-up-murah-cepat-free-fire',
                'category_key' => 'free-fire',
                'title' => 'Top Up Murah & Cepat, Ini Cara Dapat Harga Terbaik di Free Fire',
                'published_at' => '2026-04-28 09:00:00',
            ],
            [
                'slug' => '5-hero-mobile-legend-terkuat',
                'category_key' => 'mobile-legend',
                'title' => '5 Hero Mobile Legend Terkuat Season Ini yang Wajib Kamu Coba',
                'published_at' => '2026-04-25 09:00:00',
            ],
            [
                'slug' => 'tips-bermain-honor-of-kings-pemula',
                'category_key' => 'honor-of-kings',
                'title' => 'Tips Bermain Honor of Kings untuk Pemula agar Cepat Naik Rank',
                'published_at' => '2026-04-22 09:00:00',
                'category_label' => 'Honor Of Kings',
            ],
            [
                'slug' => 'agent-terbaik-valorant-2026',
                'category_key' => 'valorant',
                'title' => 'Agent Terbaik Valorant 2026 dan Cara Bermain Efektif di Setiap Map',
                'published_at' => '2026-04-20 09:00:00',
            ],
            [
                'slug' => 'update-terbaru-free-fire-senjata-baru',
                'category_key' => 'free-fire',
                'title' => 'Update Terbaru Free Fire: Senjata Baru, Map Baru, dan Event Eksklusif',
                'published_at' => '2026-04-18 09:00:00',
            ],
            [
                'slug' => 'flash-sale-top-up-diamond-diskon',
                'category_key' => 'promo',
                'title' => 'Flash Sale Minggu Ini: Top Up Diamond dengan Harga Diskon Besar',
                'published_at' => '2026-04-15 09:00:00',
            ],
            [
                'slug' => 'cara-dapat-skin-gratis-mobile-legends',
                'category_key' => 'mobile-legend',
                'title' => 'Cara Dapat Skin Gratis di Mobile Legends Tanpa Harus Spend Banyak',
                'published_at' => '2026-04-13 09:00:00',
            ],
            [
                'slug' => 'strategi-chicken-dinner-pubg-mobile',
                'category_key' => 'lainnya',
                'title' => 'Strategi Menang Chicken Dinner di PUBG Mobile untuk Solo dan Squad',
                'published_at' => '2026-04-10 09:00:00',
                'category_label' => 'PUBG Mobile',
            ],
            [
                'slug' => 'promo-double-diamond-top-up',
                'category_key' => 'promo',
                'title' => 'Promo Double Diamond: Top Up Sekarang dan Dapatkan Bonus Dua Kali Lipat',
                'published_at' => '2026-04-08 09:00:00',
            ],
            [
                'slug' => 'event-honor-of-kings-battle-pass-10',
                'category_key' => 'honor-of-kings',
                'title' => 'Event Honor of Kings Terbaru: Battle Pass Musim 10 Penuh Reward Menarik',
                'published_at' => '2026-04-05 09:00:00',
                'category_label' => 'Honor Of Kings',
            ],
            [
                'slug' => 'patch-terbaru-valorant-perubahan-meta',
                'category_key' => 'valorant',
                'title' => 'Patch Terbaru Valorant: Perubahan Meta dan Buff Hero yang Wajib Diketahui',
                'published_at' => '2026-04-03 09:00:00',
            ],
            [
                'slug' => 'kolaborasi-free-fire-naruto',
                'category_key' => 'free-fire',
                'title' => 'Kolaborasi Free Fire x Naruto: Skin Eksklusif yang Bikin Heboh',
                'published_at' => '2026-04-01 09:00:00',
            ],
            [
                'slug' => 'hero-baru-mobile-legends-skill-unik',
                'category_key' => 'mobile-legend',
                'title' => 'Hero Baru Mobile Legends: Skill Unik dan Cara Optimal Memainkannya',
                'published_at' => '2026-03-28 09:00:00',
            ],
            [
                'slug' => 'cashback-20-top-up-udn-april',
                'category_key' => 'promo',
                'title' => 'Cashback 20% Setiap Top Up via UDN, Berlaku Sepanjang Bulan April',
                'published_at' => '2026-03-25 09:00:00',
            ],
            [
                'slug' => 'pubg-mobile-world-invitational-2026',
                'category_key' => 'lainnya',
                'title' => 'PUBG Mobile World Invitational 2026: Tim Indonesia Siap Bersaing',
                'published_at' => '2026-03-22 09:00:00',
                'category_label' => 'PUBG Mobile',
            ],
            [
                'slug' => 'honor-of-kings-global-tips-top-up',
                'category_key' => 'honor-of-kings',
                'title' => 'Honor of Kings Global: Perbedaan Server dan Tips Top Up yang Aman',
                'published_at' => '2026-03-20 09:00:00',
                'category_label' => 'Honor Of Kings',
            ],
        ];

        foreach ($articles as $index => $article) {
            Article::updateOrCreate(
                ['slug' => $article['slug'], 'locale' => 'id'],
                [
                    'article_category_id' => $categoryIds[$article['category_key']],
                    'category_label' => $article['category_label'] ?? null,
                    'author_name' => 'Admin_Topupgame',
                    // The first three double as the homepage's "latest news"
                    // rail; the rest are articles.
                    'type' => $index < 3 ? 'news' : 'article',
                    'locale' => 'id',
                    'title' => $article['title'],
                    'excerpt' => Str::limit(strip_tags($body[0]['paragraphs'][0]), 160),
                    'body_sections' => $body,
                    'is_published' => true,
                    'is_featured' => $index < 3,
                    'published_at' => $article['published_at'],
                    'meta_title' => $article['title'],
                    'meta_description' => Str::limit(strip_tags($body[0]['paragraphs'][0]), 160),
                    'meta_keywords' => ['top up', 'game', 'diamond'],
                    'meta_robots' => 'index,follow',
                ],
            );
        }
    }
}
