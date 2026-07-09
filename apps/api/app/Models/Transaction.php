<?php

namespace App\Models;

use App\Enums\TransactionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'status' => TransactionStatus::class,
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function pointHistories()
    {
        return $this->hasMany(PointHistory::class);
    }

    public function rating()
    {
        return $this->hasOne(Rating::class);
    }

    public function paymentChannel()
    {
        return $this->belongsTo(PaymentChannel::class);
    }
}
