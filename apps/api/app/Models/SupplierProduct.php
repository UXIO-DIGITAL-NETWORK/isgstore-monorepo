<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierProduct extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'sync_deactivated_at' => 'datetime',
        'is_price_locked' => 'boolean',
        'margin_member' => 'float',
        'margin_vip' => 'float',
        'margin_reseller' => 'float',
        'margin_agent' => 'float',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
