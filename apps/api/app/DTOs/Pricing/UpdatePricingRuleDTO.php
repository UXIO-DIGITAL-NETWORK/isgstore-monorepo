<?php

namespace App\DTOs\Pricing;

readonly class UpdatePricingRuleDTO
{
    public function __construct(
        public ?int $categoryId,
        /** Null = the rule applies to every membership plan. */
        public ?int $membershipPlanId,
        public float $markupPercent,
        public int $markupFlat,
    ) {}
}
