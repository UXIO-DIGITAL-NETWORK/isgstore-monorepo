<?php

declare(strict_types=1);

namespace App\DTOs\Refund;

readonly class CompleteRefundDTO
{
    public function __construct(
        /** Stored path of the transfer receipt; the controller stores the file. */
        public ?string $proofPath = null,
        public ?string $note = null,
    ) {}
}
