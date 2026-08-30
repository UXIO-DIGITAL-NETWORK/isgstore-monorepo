<?php

namespace App\Models;

use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RefundRequest extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'method' => RefundMethod::class,
        'status' => RefundStatus::class,
        'amount' => 'integer',
        'claim_expires_at' => 'datetime',
        'claim_notified_at' => 'datetime',
        'payout_submitted_at' => 'datetime',
        'processed_at' => 'datetime',
        'refunded_at' => 'datetime',
        'settlement_reversed_at' => 'datetime',
    ];

    /**
     * The token hash is a lookup key for a bearer credential — it must never
     * ride along in a serialized model, however the row is returned.
     *
     * @var list<string>
     */
    protected $hidden = ['claim_token_hash'];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    /** The buyer, when they had an account. Null for guests. */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** The "client" whose settlement this refund un-books. */
    public function merchant()
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /** True once the customer (or an admin) has supplied where to send the money. */
    public function hasPayoutDetails(): bool
    {
        return $this->bank_code !== null;
    }
}
