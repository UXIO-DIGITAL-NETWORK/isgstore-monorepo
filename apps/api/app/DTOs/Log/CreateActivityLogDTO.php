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
        /** Set for order-scoped events so the admin can show one order's trail. */
        public ?int $transactionId = null,
        /** True for automated machine-to-machine events; hidden from the admin feed. */
        public bool $isSystem = false,
    ) {}
}
