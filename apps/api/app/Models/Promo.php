<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_public' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function redemptions()
    {
        return $this->hasMany(PromoRedemption::class);
    }

    /**
     * Active and inside its window. Null bounds mean "no limit" on that side,
     * so an open-ended promo is not filtered out by a missing date.
     */
    public function scopeRunning(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()));
    }
}
