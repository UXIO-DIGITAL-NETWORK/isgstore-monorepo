<?php

namespace App\DTOs\Transaction;

readonly class CreateTransactionDTO
{
    public function __construct(
        public int $productId,
        public ?int $userId,
        public ?int $paymentChannelId,
        public ?int $supplierId,
        public ?string $guestContact,
        public ?string $targetUid,
        public ?string $targetServer,
        public int $amountBase,
        public int $amountFee,
        public int $amountTotal,
        public int $totalPrice,
        public int $margin,
        public string $status,
        public bool $isManual,
        public ?string $sn,
        public ?string $supplierTrxId,
        public ?string $supplierStatus,
        // Every identifier the product's category declares, keyed by its field
        // keys and in declaration order. Empty when the category has no schema,
        // in which case the two mirrored values above are all there is.
        public array $orderFields = [],
    ) {}
}
