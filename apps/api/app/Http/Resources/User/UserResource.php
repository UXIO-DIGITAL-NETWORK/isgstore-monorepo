<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role_id' => $this->role_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'balance' => (float) $this->balance,
            'point' => $this->point,
            'locale' => $this->locale,
            'timezone' => $this->timezone,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
