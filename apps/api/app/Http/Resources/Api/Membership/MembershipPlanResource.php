<?php

namespace App\Http\Resources\Api\Membership;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Flattens the locale-keyed `name`/`benefits` JSON to plain values for the
 * admin table (single-locale 'id'), while keeping the structured price/role
 * config the form edits.
 */
class MembershipPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->localizedName(),
            'benefits' => $this->localizedBenefits(),
            'price' => (int) $this->price,
            // NULL, not 0 — the admin table renders it as "Lifetime".
            'duration_days' => $this->duration_days === null ? null : (int) $this->duration_days,
            'role_id' => $this->role_id,
            'is_popular' => (bool) $this->is_popular,
            'is_active' => (bool) $this->is_active,
            'sort_order' => (int) $this->sort_order,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
