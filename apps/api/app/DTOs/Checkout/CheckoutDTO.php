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
        // Every identifier the game asked for, keyed by the category's field keys.
        // Empty when the client used the legacy positional pair instead — the
        // checkout action widens that into the same map.
        public array $orderFields = [],
        // Tambahkan parameter untuk menyimpan kontak guest
        public ?string $guestContact = null,
        // Nickname yang ditampilkan saat konfirmasi order. Nullable: tidak semua
        // game punya provider validasi, dan checkout tidak boleh bergantung padanya.
        public ?string $targetNickname = null,
        // Optional discount code, re-validated server-side at checkout — the
        // client's quoted discount is never trusted.
        public ?string $promoCode = null,
        // Email tujuan bukti pembelian (wajib untuk semua) + bahasa email (id|en).
        public ?string $email = null,
        public ?string $locale = null,
        // Loyalty points the customer asked to redeem. Capped server-side at
        // both their balance and the order's value — the client's figure is
        // never trusted, exactly like the promo discount above.
        public int $pointsToSpend = 0,
    ) {}
}
