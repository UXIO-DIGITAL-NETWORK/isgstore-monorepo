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

    /**
     * Rows that are ACTIVE *and* still inside their window — where a window-less
     * row is inside it by definition.
     *
     * A NULL `ends_at` is a licence bought outright (see the
     * `allow_lifetime_service_subscriptions` migration). Without the null arm
     * this scope would quietly exclude every lifetime row — `NULL > now()` is
     * false — and a site the client had paid for in full would read as unsubscribed.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', SubscriptionStatus::ACTIVE)
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()));
    }

    /**
     * A subscription with no end date — paid once, never expires.
     *
     * The single definition of the sentinel, so "lifetime" cannot come to mean
     * two different things. Same rule as `MembershipSubscription::isLifetime()`.
     */
    public function isLifetime(): bool
    {
        return $this->ends_at === null;
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
