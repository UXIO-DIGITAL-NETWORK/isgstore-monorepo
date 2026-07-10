<?php

namespace App\Actions\Pricing;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Pricing\CreatePricingRuleDTO;
use App\Models\PricingRule;
use Illuminate\Support\Facades\Auth;

class CreatePricingRuleAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(CreatePricingRuleDTO $dto): PricingRule
    {
        $rule = PricingRule::create([
            'category_id' => $dto->categoryId,
            'role' => $dto->role,
            'markup_percent' => $dto->markupPercent,
            'markup_flat' => $dto->markupFlat,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created Pricing Rule: {$rule->role} ".($rule->category_id ? "(category {$rule->category_id})" : '(global)')
        ));

        return $rule;
    }
}
