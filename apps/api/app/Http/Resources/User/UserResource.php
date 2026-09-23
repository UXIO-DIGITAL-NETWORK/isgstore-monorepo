<?php

namespace App\Http\Resources\User;

use App\Support\Auth\TwoFactorPolicy;
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
            // to setup before firing a request that will be refused. Both read
            // the same policy, so an exempt account is let through on both sides
            // rather than being bounced to setup after the API has already said
            // yes.
            'two_factor_enabled' => $this->two_factor_confirmed_at !== null,
            'two_factor_required' => TwoFactorPolicy::requiredFor($this->resource),
            // An authenticator move that was started but never confirmed. The
            // panel resumes it rather than offering to start over, which would
            // only fail against the secret already waiting.
            'two_factor_pending' => $this->two_factor_pending_secret !== null,
            'status' => $this->status ?? 'active',
            'locale' => $this->locale,
            'timezone' => $this->timezone,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
