<?php

namespace App\Http\Resources\User;

use App\Enums\RoleType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role_id' => $this->role_id,
            'name' => $this->name,
            'username' => $this->username,
            'avatar' => $this->avatar,
            'avatar_url' => $this->avatar ? Storage::disk('public')->url($this->avatar) : null,
            'role' => $this->whenLoaded('role', fn () => strtolower((string) $this->role->name)),
            'email' => $this->email,
            'phone' => $this->phone,
            'balance' => (float) $this->balance,
            'point' => $this->point,
            // The navigation signal. `EnsureTwoFactorSatisfied` does the
            // enforcing with a 403; this is what lets the client route an admin
            // to setup before firing a request that will be refused.
            'two_factor_enabled' => $this->two_factor_confirmed_at !== null,
            'two_factor_required' => strtolower((string) ($this->role?->name ?? '')) === RoleType::ADMIN->value,
            'status' => $this->status ?? 'active',
            'locale' => $this->locale,
            'timezone' => $this->timezone,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
