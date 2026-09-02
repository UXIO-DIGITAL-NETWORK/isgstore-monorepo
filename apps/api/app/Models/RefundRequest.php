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
        'points_amount' => 'integer',
        'claim_expires_at' => 'datetime',
        'claim_notified_at' => 'datetime',
        'claimed_at' => 'datetime',
        'verify_due_at' => 'datetime',
        'claim_rejected_count' => 'integer',
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

    /**
     * The account a guest used to claim this refund. Distinct from `user()`:
     * that one says "the buyer was a member when they ordered", this one says
     * "a guest came back and proved an account". Both are set on a claim, but
     * only this one records that the claim happened.
     */
    public function claimedUser()
    {
        return $this->belongsTo(User::class, 'claimed_user_id');
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

    /**
     * Whether a bank account may still be written to this refund.
     *
     * Status is not enough. `RefundStatus::payoutEditable()` includes PENDING,
     * and a claimed `balance_claim` refund sits in PENDING — asking status
     * alone would re-open the bank-transfer form on the very scheme that
     * retired it, and then sail through the `hasPayoutDetails()` guards in the
     * process/complete actions. Method and status are one question here.
     */
    public function isPayoutEditable(): bool
    {
        return $this->requiresPayoutDetails()
            && in_array($this->status, RefundStatus::payoutEditable(), true);
    }

    /**
     * Whether this refund needs a payout destination at all. Only the retired
     * manual-transfer path does; a balance claim is paid to an account.
     */
    public function requiresPayoutDetails(): bool
    {
        return $this->method === RefundMethod::MANUAL_TRANSFER;
    }

    /** True once a guest has attached an account and is waiting on an admin. */
    public function isClaimed(): bool
    {
        return $this->claimed_user_id !== null;
    }

    /** Past its 2x24 working-hour promise, and still owed. */
    public function isOverdue(): bool
    {
        return $this->verify_due_at !== null
            && ! $this->status->isTerminal()
            && $this->verify_due_at->isPast();
    }
}
