<?php

namespace App\DTOs\Order;

readonly class CreateOrderDTO
{
    public function __construct(
        public int $userId,
        public int $productId,
        public ?int $supplierId,
        public ?string $targetUid,
        public ?string $targetServer,
        public int $totalPrice,
        public int $margin,
        public string $status,
        public bool $isManual,
        public ?string $sn,
        public ?string $supplierTrxId,
        public ?string $supplierStatus
    ) {}
}
