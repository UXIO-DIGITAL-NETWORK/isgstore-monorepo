<?php

return [
    // WhatsApp receipt (bukti pembayaran) caption. Kept short — the invoice PDF
    // is attached as the document; this is just the accompanying message.
    'receipt_caption' => "*:brand* — Bukti Pembayaran\n\n".
        "Halo, pesananmu telah *selesai*. Berikut ringkasannya:\n\n".
        "Invoice: *:invoice*\n".
        ":product\n".
        "ID Akun: :target\n".
        "Total: *:total*\n\n".
        'Bukti pembayaran lengkap terlampir sebagai PDF. Terima kasih! 🙏',

    'receipt_caption_no_target' => "*:brand* — Bukti Pembayaran\n\n".
        "Halo, pesananmu telah *selesai*. Berikut ringkasannya:\n\n".
        "Invoice: *:invoice*\n".
        ":product\n".
        "Total: *:total*\n\n".
        'Bukti pembayaran lengkap terlampir sebagai PDF. Terima kasih! 🙏',
];
