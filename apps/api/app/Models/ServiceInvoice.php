<?php

namespace App\Models;

use App\Enums\ServiceInvoiceStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceInvoice extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'status' => ServiceInvoiceStatus::class,
        'due_at' => 'datetime',
        'proof_uploaded_at' => 'datetime',
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
}
