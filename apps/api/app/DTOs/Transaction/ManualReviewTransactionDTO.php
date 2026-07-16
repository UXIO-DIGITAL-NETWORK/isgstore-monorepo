<?php

namespace App\DTOs\Transaction;

use Illuminate\Http\UploadedFile;

readonly class ManualReviewTransactionDTO
{
    public function __construct(
        public string $status,
        public ?string $sn,
        public UploadedFile|string|null $proof,
    ) {}
}
