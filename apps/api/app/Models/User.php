<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['role_id', 'name', 'username', 'avatar', 'email', 'google_id', 'password', 'phone', 'balance', 'point', 'status', 'locale', 'timezone', 'email_verified_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'membership_expires_at' => 'datetime',
            'point' => 'integer',
            'auto_renew' => 'boolean',
            'password' => 'hashed',
            // Encrypted at rest: a database read must not hand over a shared
            // secret. Note this couples enrolment to APP_KEY — see the migration.
            'two_factor_secret' => 'encrypted',
            // A rotation in progress. Never the secret in force — that stays in
            // `two_factor_secret` until a code from the new device proves it.
            'two_factor_pending_secret' => 'encrypted',
            'two_factor_pending_created_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_last_used_timestep' => 'integer',
        ];
    }

    /** The pricing tier this account is on. Null resolves to the default plan. */
    public function membershipPlan()
    {
        return $this->belongsTo(MembershipPlan::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }
}
