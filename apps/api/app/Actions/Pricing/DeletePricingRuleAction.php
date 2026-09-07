<?php

namespace App\Actions\Pricing;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\PricingRule;
use Illuminate\Support\Facades\Auth;

class DeletePricingRuleAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(PricingRule $pricingRule): void
    {
        $description = $pricingRule->role.' '.($pricingRule->category_id ? "(category {$pricingRule->category_id})" : '(global)');

        $pricingRule->delete();

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Deleted Pricing Rule: {$description}"
        ));
    }
}
