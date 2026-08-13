<?php

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceSubscription extends Model
{
    use HasFactory;

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

    /**
     * The installation covering this period. Deliberately NOT an Eloquent
     * relation: the join is two columns (merchant_id, service_id) because
     * installations are per service account, not per paid period, and hasOne
     * cannot express that. Naming it resolve* keeps it from being reached for
     * with `with()` by mistake.
     */
    public function resolveInstallation(): ?ServiceInstallation
    {
        return ServiceInstallation::query()
            ->where('merchant_id', $this->merchant_id)
            ->where('service_id', $this->service_id)
            ->first();
    }
}
