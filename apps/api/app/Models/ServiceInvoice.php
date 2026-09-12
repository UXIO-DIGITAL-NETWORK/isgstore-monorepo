<?php

namespace App\Models;

use App\Enums\ServiceInvoiceStatus;
use App\Models\Concerns\ResolvesServiceInstallation;
use App\Observers\ServiceInvoiceObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(ServiceInvoiceObserver::class)]
class ServiceInvoice extends Model
{
    use HasFactory;
    use ResolvesServiceInstallation;

    protected $guarded = ['id'];

    protected $casts = [
        'status' => ServiceInvoiceStatus::class,
        'due_at' => 'datetime',
        'verified_at' => 'datetime',
        'period_starts_at' => 'datetime',
        'period_ends_at' => 'datetime',
        'settled_offline' => 'boolean',
        'amount' => 'integer',
        'duration_days' => 'integer',
    ];

    public function merchant()
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /** The payment-internal user who confirmed or rejected the bukti transfer. */
    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function subscription()
    {
        return $this->hasOne(ServiceSubscription::class);
    }

    /** This bill's rows on the attempts that covered it — amount and fee share. */
    public function paymentItems()
    {
        return $this->hasMany(ServiceInvoicePaymentItem::class);
    }

    /**
     * Every Monetapay attempt made against this bill, newest last.
     *
     * Through the pivot, not the FK: an attempt may cover several bills, and
     * `service_invoice_payments.service_invoice_id` is null for those. Reading
     * the FK would make a batch payment invisible on every bill it settled.
     */
    public function payments()
    {
        return $this->belongsToMany(ServiceInvoicePayment::class, 'service_invoice_payment_items')
            ->withPivot(['amount', 'admin_fee'])
            ->withTimestamps();
    }

    /**
     * The attempt the client is currently looking at.
     *
     * "Latest", not "the PENDING one": once an attempt is paid or expired the
     * invoice page still has to show which one it was.
     *
     * hasOneThrough + latest() rather than latestOfMany(), which has no
     * many-to-many form. Eager loading matches the FIRST row per parent, and the
     * ordering makes that the newest — pinned by a test, because it is the kind
     * of thing a future refactor breaks silently.
     */
    public function latestPayment()
    {
        return $this->hasOneThrough(
            ServiceInvoicePayment::class,
            ServiceInvoicePaymentItem::class,
            'service_invoice_id',
            'id',
            'id',
            'service_invoice_payment_id',
        )->latest('service_invoice_payments.id');
    }

    /** A bill this site issued because the Hub said to, not because a client asked. */
    public function isFromHubPlan(): bool
    {
        return $this->source === 'hub_plan';
    }
}
