<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberApiCredential extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['key_hash'];

    protected $casts = [
        'whitelist_ips' => 'array',
        'last_used_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
