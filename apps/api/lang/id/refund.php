<?php

return [
    // ── Claim email: "your money is waiting, tell us where to send it" ──
    'claim_subject' => 'Pengembalian Dana · :invoice',
    'claim_preheader' => 'Pesananmu gagal diproses. Beri tahu kami rekening tujuan pengembalian dana.',
    'claim_title' => 'Pengembalian Dana',
    'claim_greeting' => 'Halo,',
    'claim_intro' => 'Mohon maaf, pesananmu tidak dapat kami proses. Dananya akan kami kembalikan sepenuhnya.',
    'claim_action_intro' => 'Karena kamu memesan tanpa akun, kami membutuhkan rekening atau e-wallet tujuan. Klik tombol di bawah untuk mengisinya — prosesnya kurang dari satu menit.',
    'claim_cta' => 'Isi Rekening Tujuan',
    'claim_fallback' => 'Jika tombol tidak berfungsi, salin tautan ini ke browser:',

    // ── Completed email: "we have sent it" ──
    'done_subject' => 'Pengembalian Dana Selesai · :invoice',
    'done_preheader' => 'Dana pengembalian sudah kami transfer.',
    'done_title' => 'Pengembalian Dana Selesai',
    'done_intro' => 'Dana pengembalian untuk pesananmu sudah kami transfer ke rekening yang kamu berikan.',
    'done_note' => 'Dana biasanya masuk dalam beberapa menit, namun bisa memakan waktu hingga 1×24 jam tergantung bank penerima.',

    // ── Shared rows ──
    'label_invoice' => 'Nomor Invoice',
    'label_amount' => 'Jumlah Pengembalian',
    'label_product' => 'Produk',
    'label_destination' => 'Rekening Tujuan',

    'help' => 'Butuh bantuan? Balas email ini atau hubungi tim support kami.',

    // ── WhatsApp ──
    'wa_claim' => "*:brand* — Pengembalian Dana\n\n".
        "Halo, mohon maaf pesanan *:invoice* tidak dapat kami proses.\n".
        "Dana sebesar *:amount* akan kami kembalikan sepenuhnya.\n\n".
        "Isi rekening tujuanmu di sini:\n:url\n\n".
        'Terima kasih atas pengertianmu. 🙏',

    'wa_done' => "*:brand* — Pengembalian Dana Selesai\n\n".
        "Dana *:amount* untuk pesanan *:invoice* sudah kami transfer ke :destination.\n\n".
        'Terima kasih atas pengertianmu. 🙏',
];
