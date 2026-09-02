<?php

declare(strict_types=1);

namespace App\DTOs\Membership;

readonly class SubscribeMembershipDTO
{
    public function __construct(
        public int $membershipPlanId,
    ) {}
}
