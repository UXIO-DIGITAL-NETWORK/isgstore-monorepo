<?php

namespace App\Http\Resources\Api;

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
            'actor' => $this->user?->name ?? 'System',
            'role' => $this->user?->role?->name,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'message' => $this->message,
            'created_at' => $this->created_at,
        ];
    }
}
