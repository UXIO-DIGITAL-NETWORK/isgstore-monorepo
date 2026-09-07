<?php

namespace App\Models;

use App\Enums\WithdrawalStatus;
use App\Observers\WithdrawalObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(WithdrawalObserver::class)]
class Withdrawal extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'status' => WithdrawalStatus::class,
        'payout_data' => 'array',
        'approved_at' => 'datetime',
    ];

    public function merchant()
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /** The internal user who created this request, for an internal withdrawal (merchant_id null). */
    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
