<?php

namespace App\DTOs\Transaction;

readonly class UpdateTransactionDTO
{
    public function __construct(
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
        // See CreateTransactionDTO: the full keyed identifier set, in the
        // category's declaration order.
        public array $orderFields = [],
    ) {}
}
