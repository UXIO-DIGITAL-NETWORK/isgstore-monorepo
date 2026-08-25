<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipPlan extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'name' => 'array',
        'benefits' => 'array',
        'is_popular' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * A plan with no duration never expires.
     *
     * The single definition of the NULL sentinel — subscribe(), the expiry cron
     * and the resources all go through here rather than comparing to null
     * inline, so "lifetime" cannot come to mean two different things.
     */
    public function isLifetime(): bool
    {
        return $this->duration_days === null;
    }

    /** Locale-keyed name, falling back to Indonesian then to the code. */
    public function localizedName(string $locale = 'id'): string
    {
        $name = $this->name ?? [];

        return $name[$locale] ?? $name['id'] ?? $this->code;
    }

    /** @return array<int, string> */
    public function localizedBenefits(string $locale = 'id'): array
    {
        $benefits = $this->benefits ?? [];

        return $benefits[$locale] ?? $benefits['id'] ?? [];
    }
}
