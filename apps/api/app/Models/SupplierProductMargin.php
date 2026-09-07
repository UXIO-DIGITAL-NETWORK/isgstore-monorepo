<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * The margin an admin authored for one SKU on one membership plan.
 *
 * The source of truth for pricing that SKU; `product_plan_prices.margin_percent`
 * only records what was applied the last time prices were written.
 */
class SupplierProductMargin extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'margin_percent' => 'float',
    ];

    public function supplierProduct()
    {
        return $this->belongsTo(SupplierProduct::class);
    }

    public function membershipPlan()
    {
        return $this->belongsTo(MembershipPlan::class);
    }
}
