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
        public ?string $guestContact = null
    ) {}
}
