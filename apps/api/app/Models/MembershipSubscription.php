<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class MembershipSubscription extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    /**
     * Still covering the member right now.
     *
     * A NULL `ends_at` is a lifetime subscription and always qualifies — the
     * single place that encodes it, because a plain `ends_at > now()` silently
     * excludes lifetime rows: the member's own membership page reports nothing,
     * and a renewal would start from scratch. Both were live bugs the first time
     * this predicate was written by hand in each caller.
     */
    public function scopeCurrentlyActive(Builder $query): Builder
    {
        return $query
            ->where('status', 'active')
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()));
    }

    /** Never expires. */
    public function isLifetime(): bool
    {
        return $this->ends_at === null;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function membershipPlan()
    {
        return $this->belongsTo(MembershipPlan::class);
    }
}
