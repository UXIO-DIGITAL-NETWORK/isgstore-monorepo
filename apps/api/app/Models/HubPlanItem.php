<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One period of the Hub's service plan for this site, as the Hub last described
 * it. Upserted by `item_key`; never deleted.
 */
class HubPlanItem extends Model
{
    public const MODE_PREPAID = 'prepaid';

    protected $guarded = ['id'];

    protected $casts = [
        'period_index' => 'integer',
        'amount' => 'integer',
        'duration_days' => 'integer',
        'period_starts_at' => 'datetime',
        'period_ends_at' => 'datetime',
        'due_at' => 'datetime',
        'governs_licence' => 'boolean',
        'is_active' => 'boolean',
        'synced_at' => 'datetime',
    ];

    public function invoice()
    {
        return $this->hasOne(ServiceInvoice::class, 'hub_item_key', 'item_key');
    }

    public function isPrepaid(): bool
    {
        return $this->billing_mode === self::MODE_PREPAID;
    }
}
