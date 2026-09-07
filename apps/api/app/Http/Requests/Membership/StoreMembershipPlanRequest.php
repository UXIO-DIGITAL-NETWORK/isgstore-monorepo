<?php

namespace App\Http\Requests\Membership;

use Illuminate\Foundation\Http\FormRequest;

class StoreMembershipPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'unique:membership_plans,code'],
            'name' => ['required', 'string', 'max:255'],
            'benefits' => ['nullable', 'array'],
            'benefits.*' => ['string', 'max:255'],
            'price' => ['required', 'integer', 'min:0'],
            // NULL = lifetime. `present` keeps the field a deliberate choice
            // rather than something an incomplete payload omits by accident.
            'duration_days' => ['present', 'nullable', 'integer', 'min:1'],
            'role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'is_popular' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
