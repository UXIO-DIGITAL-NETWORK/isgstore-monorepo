<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BalanceTopup extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'payment_data' => 'array',
        'paid_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function paymentChannel()
    {
        return $this->belongsTo(PaymentChannel::class);
    }
}
