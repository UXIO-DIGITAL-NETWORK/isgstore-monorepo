<?php

namespace App\DTOs\Checkout;

readonly class CheckoutDTO
{
    public function __construct(
        // Ubah menjadi nullable karena guest tidak memiliki ID
        public ?int $userId,
        public int $productId,
        public int $paymentChannelId,
        public string $targetUid,
        public ?string $targetServer = null,
        // Tambahkan parameter untuk menyimpan kontak guest
        public ?string $guestContact = null,
        // Nickname yang ditampilkan saat konfirmasi order. Nullable: tidak semua
        // game punya provider validasi, dan checkout tidak boleh bergantung padanya.
        public ?string $targetNickname = null,
        // Optional discount code, re-validated server-side at checkout — the
        // client's quoted discount is never trusted.
        public ?string $promoCode = null,
    ) {}
}
