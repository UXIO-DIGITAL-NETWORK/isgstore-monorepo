<?php

declare(strict_types=1);

namespace App\Http\Requests\Membership;

use App\DTOs\Membership\SubscribeMembershipDTO;
use Illuminate\Foundation\Http\FormRequest;

class SubscribeMembershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'membership_plan_id' => ['required', 'integer', 'exists:membership_plans,id'],
        ];
    }

    public function toDTO(): SubscribeMembershipDTO
    {
        return new SubscribeMembershipDTO(
            membershipPlanId: (int) $this->validated('membership_plan_id'),
        );
    }
}
