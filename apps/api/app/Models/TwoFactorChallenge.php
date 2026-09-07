<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A password accepted, a second factor still owed.
 *
 * Deliberately not a token of any kind that `auth:sanctum` would recognise —
 * see the migration docblock.
 */
class TwoFactorChallenge extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
        'attempts' => 'integer',
    ];

    /** The hash is a lookup key for a bearer credential; never serialize it. */
    protected $hidden = ['token_hash'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
