<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * What one product costs a customer on one membership plan.
 *
 * Written only by `App\Actions\Pricing\WritePlanPricesAction` — it is the row
 * that keeps `products.price_member` honest, and two writers would let the
 * denormalised copy drift from the truth.
 */
class ProductPlanPrice extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'price' => 'integer',
        'margin_percent' => 'float',
        'margin_flat' => 'integer',
        'is_manual' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function membershipPlan()
    {
        return $this->belongsTo(MembershipPlan::class);
    }
}
