<?php

namespace App\Models;

use App\Enums\SubscriptionStatus;
use App\Models\Concerns\ResolvesServiceInstallation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceSubscription extends Model
{
    use HasFactory;
    use ResolvesServiceInstallation;

    protected $guarded = ['id'];

    protected $casts = [
        'status' => SubscriptionStatus::class,
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    /** Rows that are ACTIVE *and* still inside their window. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', SubscriptionStatus::ACTIVE)->where('ends_at', '>', now());
    }

    public function merchant()
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function invoice()
    {
        return $this->belongsTo(ServiceInvoice::class, 'service_invoice_id');
    }
}
