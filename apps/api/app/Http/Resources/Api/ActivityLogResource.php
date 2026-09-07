<?php

namespace App\Http\Resources\Api;

use App\Support\Activity\ActivityTypeClassifier;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'transaction_id' => $this->transaction_id,
            // Stored type wins; otherwise derive a display category so the admin
            // Activity "Type" column is meaningful for un-typed rows.
            'type' => ActivityTypeClassifier::classify($this->type, $this->transaction_id, $this->message),
            // No user means either an automated system event or a guest
            // storefront action; the origin flag tells them apart so a guest
            // checkout reads as "Guest" rather than the misleading "System".
            'actor' => $this->user?->name ?? ($this->is_system ? 'System' : 'Guest'),
            'role' => $this->user?->role?->name,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'message' => $this->message,
            'created_at' => $this->created_at,
        ];
    }
}
