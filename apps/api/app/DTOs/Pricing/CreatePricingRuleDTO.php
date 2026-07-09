<?php

namespace App\DTOs\Pricing;

readonly class CreatePricingRuleDTO
{
    public function __construct(
        public ?int $categoryId,
        public string $role,
        public float $markupPercent,
        public int $markupFlat,
    ) {}
}
