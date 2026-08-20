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

    /** Every Monetapay attempt made against this bill, newest last. */
    public function payments()
    {
        return $this->hasMany(ServiceInvoicePayment::class);
    }

    /**
     * The attempt the client is currently looking at.
     *
     * `latestOfMany` rather than "the PENDING one": once an attempt is paid or
     * expired the invoice page still has to show which one it was.
     */
    public function latestPayment()
    {
        return $this->hasOne(ServiceInvoicePayment::class)->latestOfMany();
    }
}
