<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlashSaleItem extends Model
{
    protected $guarded = ['id'];

    public function flashSale()
    {
        return $this->belongsTo(FlashSale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /** Derived, never stored — a stored copy could drift from `stock_sold`. */
    public function stockAvailable(): int
    {
        return max(0, (int) $this->stock_total - (int) $this->stock_sold);
    }
}
