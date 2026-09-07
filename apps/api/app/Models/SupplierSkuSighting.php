<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * First time a provider SKU was seen upstream. See the creating migration for
 * why "new" cannot simply mean "not pooled".
 */
class SupplierSkuSighting extends Model
{
    use HasFactory;

    /** How recently a SKU must have appeared to still count as new. */
    public const NEW_FOR_DAYS = 7;

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'first_seen_at' => 'datetime',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
