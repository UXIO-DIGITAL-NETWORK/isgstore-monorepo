<?php

namespace App\Actions\Pricing;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Pricing\UpdatePricingRuleDTO;
use App\Models\PricingRule;
use Illuminate\Support\Facades\Auth;

class UpdatePricingRuleAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(PricingRule $pricingRule, UpdatePricingRuleDTO $dto): PricingRule
    {
        $pricingRule->update([
            'category_id' => $dto->categoryId,
            'role' => $dto->role,
            'markup_percent' => $dto->markupPercent,
            'markup_flat' => $dto->markupFlat,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Updated Pricing Rule: {$pricingRule->role} ".($pricingRule->category_id ? "(category {$pricingRule->category_id})" : '(global)')
        ));

        return $pricingRule->fresh();
    }
}
