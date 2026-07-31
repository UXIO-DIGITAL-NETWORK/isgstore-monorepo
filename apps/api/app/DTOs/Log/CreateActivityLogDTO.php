<?php

namespace App\DTOs\Log;

use App\Enums\ActivityType;

readonly class CreateActivityLogDTO
{
    public function __construct(
        public ?int $userId,
        public ?string $ipAddress,
        public ?string $userAgent,
        public string $message,
        /** Left null by legacy call sites; those rows stay in the "all" bucket. */
        public ?ActivityType $type = null,
    ) {}
}
