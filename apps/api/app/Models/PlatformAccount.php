<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformAccount extends Model
{
    protected $guarded = ['id'];

    public function mutations()
    {
        return $this->hasMany(PlatformMutation::class);
    }
}
