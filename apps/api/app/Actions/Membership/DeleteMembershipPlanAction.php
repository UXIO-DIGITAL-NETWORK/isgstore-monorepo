<?php

namespace App\Actions\Membership;

use App\Models\MembershipPlan;

class DeleteMembershipPlanAction
{
    public function execute(MembershipPlan $plan): void
    {
        $plan->delete();
    }
}
