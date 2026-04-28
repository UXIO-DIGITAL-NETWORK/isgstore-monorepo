<?php

namespace App\DTOs\Log;

readonly class CreateActivityLogDTO
{
    public function __construct(
        public ?int $userId,
        public ?string $ipAddress,
        public ?string $userAgent,
        public string $message
    ) {}
}
