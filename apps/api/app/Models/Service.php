<?php

namespace App\Models;

use App\Enums\ServiceCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A supporting service kita sells to its payment-page clients (Digiflazz,
 * Monetapay, email, domain, WhatsApp API).
 *
 * Not to be confused with `app/Services/*`, which is the outbound HTTP-client
 * layer (DigiflazzService, MonetapayService). This is a sellable catalogue row.
 */
class Service extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'category' => ServiceCategory::class,
        'features' => 'array',
        'is_active' => 'boolean',
    ];

    public function paymentChannel()
    {
        return $this->belongsTo(PaymentChannel::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(ServiceSubscription::class);
    }

    public function invoices()
    {
        return $this->hasMany(ServiceInvoice::class);
    }

    public function incidents()
    {
        return $this->hasMany(ServiceIncident::class);
    }
}
