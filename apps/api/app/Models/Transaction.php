<?php

namespace App\Models;

use App\Enums\ProviderStatus;
use App\Enums\TransactionStatus;
use App\Observers\TransactionObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(TransactionObserver::class)]
class Transaction extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'status' => TransactionStatus::class,
        // The supplier's half of the lifecycle, kept in lockstep with `status`
        // by TransactionObserver. Not to be confused with `supplier_status`,
        // which is uxiotopup's own raw wording, kept as evidence.
        'provider_status' => ProviderStatus::class,
        'receipt_sent_at' => 'datetime',
        'whatsapp_sent_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** The "client" (merchant) that owns the sold product; null for platform-owned sales. */
    public function merchant()
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    /**
     * withTrashed on purpose: an archived product must keep resolving here or
     * the history it was archived to protect breaks instead.
     *
     * Without it, `ProductResource` (which dereferences `$this->id` on a null
     * resource) 500s the admin transaction list and the dashboard,
     * `GetDashboardPerformanceAction`'s inner join silently drops the row and
     * its revenue, and `ProcessUxiotopupTransactionAction` — which reaches
     * `$transaction->product->` with no null-safe operator — cannot fulfil an
     * order that was already paid for.
     */
    public function product()
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    /** At most one — `refund_requests.transaction_id` is unique. */
    public function refundRequest()
    {
        return $this->hasOne(RefundRequest::class);
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
