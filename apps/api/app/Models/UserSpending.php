<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSpending extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'total_amount' => 'integer',
            'total_orders' => 'integer',
            'last_order_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
