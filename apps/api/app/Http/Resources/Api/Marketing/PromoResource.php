<?php

namespace App\Http\Resources\Api\Marketing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type,
            'value' => (int) $this->value,
            'max_discount' => $this->max_discount !== null ? (int) $this->max_discount : null,
            'min_purchase' => (int) $this->min_purchase,
            'scope' => $this->scope,
            'scope_id' => $this->scope_id,
            'quota_total' => $this->quota_total,
            'quota_per_user' => $this->quota_per_user,
            'used_count' => (int) $this->used_count,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'is_public' => (bool) $this->is_public,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
