<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Kita's setup record for one client's one service.
 *
 * Keyed on (merchant_id, service_id) rather than on a subscription: renewals
 * stack as new subscription rows, and a client must not lose their credentials
 * or their checklist history the moment they renew.
 */
class ServiceInstallation extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function merchant()
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /** The period that first paid for this install. Audit only. */
    public function subscription()
    {
        return $this->belongsTo(ServiceSubscription::class, 'service_subscription_id');
    }

    public function steps()
    {
        return $this->hasMany(ServiceInstallationStep::class)->orderBy('sort_order')->orderBy('id');
    }

    public function details()
    {
        return $this->hasMany(ServiceInstallationDetail::class)->orderBy('sort_order')->orderBy('id');
    }
}
