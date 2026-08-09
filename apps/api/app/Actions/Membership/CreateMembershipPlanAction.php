<?php

namespace App\Actions\Membership;

use App\Models\MembershipPlan;

class CreateMembershipPlanAction
{
    /**
     * @param  array<string, mixed>  $data  Validated payload; `name` is a single
     *                                      string stored under the 'id' locale key.
     */
    public function execute(array $data): MembershipPlan
    {
        return MembershipPlan::create([
            'code' => $data['code'],
            'name' => ['id' => $data['name']],
            'benefits' => isset($data['benefits']) ? ['id' => $data['benefits']] : null,
            'price' => $data['price'],
            'duration_days' => $data['duration_days'],
            'role_id' => $data['role_id'] ?? null,
            'is_popular' => $data['is_popular'] ?? false,
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);
    }
}
