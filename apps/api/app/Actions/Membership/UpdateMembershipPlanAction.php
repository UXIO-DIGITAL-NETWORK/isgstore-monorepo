<?php

namespace App\Actions\Membership;

use App\Models\MembershipPlan;

class UpdateMembershipPlanAction
{
    /**
     * @param  array<string, mixed>  $data  Validated payload (partial). `name`/`benefits`
     *                                      arrive as single-locale values and are folded
     *                                      into the 'id' key of the JSON columns.
     */
    public function execute(MembershipPlan $plan, array $data): MembershipPlan
    {
        $update = collect($data)
            ->only(['code', 'price', 'duration_days', 'role_id', 'is_popular', 'is_active', 'sort_order'])
            ->all();

        if (array_key_exists('name', $data)) {
            $update['name'] = ['id' => $data['name']];
        }
        if (array_key_exists('benefits', $data)) {
            $update['benefits'] = $data['benefits'] === null ? null : ['id' => $data['benefits']];
        }

        $plan->update($update);

        return $plan->refresh();
    }
}
