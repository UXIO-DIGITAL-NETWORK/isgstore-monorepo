<?php

namespace App\Http\Requests\Membership;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMembershipPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $planId = $this->route('membership_plan')?->id ?? $this->route('membershipPlan')?->id;

        return [
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('membership_plans', 'code')->ignore($planId)],
            'name' => ['sometimes', 'string', 'max:255'],
            'benefits' => ['nullable', 'array'],
            'benefits.*' => ['string', 'max:255'],
            'price' => ['sometimes', 'integer', 'min:0'],
            'duration_days' => ['sometimes', 'integer', 'min:1'],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'is_popular' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
