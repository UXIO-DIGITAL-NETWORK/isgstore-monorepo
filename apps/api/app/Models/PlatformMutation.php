<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformMutation extends Model
{
    protected $guarded = ['id'];

    public function account()
    {
        return $this->belongsTo(PlatformAccount::class, 'platform_account_id');
    }
}
