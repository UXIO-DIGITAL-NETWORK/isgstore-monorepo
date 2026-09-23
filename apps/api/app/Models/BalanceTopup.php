<?php

namespace App\Models;

use App\Observers\BalanceTopupObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(BalanceTopupObserver::class)]
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
