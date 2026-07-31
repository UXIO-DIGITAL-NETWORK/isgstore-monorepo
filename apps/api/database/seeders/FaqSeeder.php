<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

/**
 * The FAQ copy the storefront previously read from its bundled locale JSON,
 * in both languages, so the page renders identically once it reads the API.
 */
class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            [
                'question' => 'Bagaimana cara melakukan top up di TopUpGame.ID?',
                'answer' => 'Cukup pilih game yang ingin diisi, masukkan User ID atau ID karakter, pilih nominal top up, lalu selesaikan pembayaran menggunakan metode yang tersedia. Setelah pembayaran berhasil, item atau diamond akan diproses secara otomatis.',
                'locale' => 'id',
                'sort_order' => 0,
            ],
            [
                'question' => 'Berapa lama proses top up berlangsung?',
                'answer' => 'Proses top up biasanya selesai dalam hitungan menit setelah pembayaran dikonfirmasi. Kami menggunakan sistem otomatis yang beroperasi 24 jam sehari.',
                'locale' => 'id',
                'sort_order' => 1,
            ],
            [
                'question' => 'Metode pembayaran apa saja yang tersedia?',
                'answer' => 'Kami mendukung berbagai metode pembayaran populer seperti GoPay, DANA, OVO, QRIS, dan ShopeePay. Pilihan metode pembayaran ditampilkan saat checkout berdasarkan nominal yang dipilih.',
                'locale' => 'id',
                'sort_order' => 2,
            ],
            [
                'question' => 'Apakah saya perlu login untuk melakukan top up?',
                'answer' => 'Tidak perlu. Anda cukup memasukkan Game ID dan nomor WhatsApp untuk menyelesaikan transaksi sebagai tamu. Registrasi bersifat opsional dan memberikan akses ke fitur tambahan seperti riwayat transaksi.',
                'locale' => 'id',
                'sort_order' => 3,
            ],
            [
                'question' => 'Bagaimana jika top up belum masuk ke akun saya?',
                'answer' => 'Jika top up tidak berhasil dalam 15 menit setelah pembayaran, hubungi tim support kami melalui Chat WhatsApp. Siapkan nomor invoice dan bukti pembayaran untuk mempercepat proses pengecekan.',
                'locale' => 'id',
                'sort_order' => 4,
            ],
            [
                'question' => 'How do I top up at TopUpGame.ID?',
                'answer' => 'Simply choose the game you want to top up, enter your User ID or character ID, select the top-up amount, then complete the payment using an available method. Once payment is successful, the item or diamond will be processed automatically.',
                'locale' => 'en',
                'sort_order' => 0,
            ],
            [
                'question' => 'How long does the top-up process take?',
                'answer' => 'The top-up process is usually completed within minutes after payment is confirmed. We use an automated system that operates 24 hours a day.',
                'locale' => 'en',
                'sort_order' => 1,
            ],
            [
                'question' => 'What payment methods are available?',
                'answer' => 'We support a wide range of popular payment methods including GoPay, DANA, OVO, QRIS, and ShopeePay. Available payment options are displayed at checkout based on the selected amount.',
                'locale' => 'en',
                'sort_order' => 2,
            ],
            [
                'question' => 'Do I need to log in to make a top-up?',
                'answer' => 'No. You only need to enter your Game ID and WhatsApp number to complete a transaction as a guest. Registration is optional and gives access to extra features such as transaction history.',
                'locale' => 'en',
                'sort_order' => 3,
            ],
            [
                'question' => 'What if the top-up hasn\'t arrived in my account?',
                'answer' => 'If the top-up has not arrived within 15 minutes after payment, please contact our support team via WhatsApp Chat. Have your invoice number and proof of payment ready to speed up the verification process.',
                'locale' => 'en',
                'sort_order' => 4,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(
                ['question' => $faq['question'], 'locale' => $faq['locale']],
                ['answer' => $faq['answer'], 'sort_order' => $faq['sort_order'], 'is_active' => true],
            );
        }
    }
}
