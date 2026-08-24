<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'is_price_locked' => 'boolean',
        'is_price_hidden' => 'boolean',
        'price_min' => 'integer',
        'price_max' => 'integer',
        'published_at' => 'datetime',
    ];

    /** Never published, as opposed to published-then-deactivated. */
    public function isDraft(): bool
    {
        return ! $this->status && $this->published_at === null;
    }

    /** The "client" (merchant) that sells this product; null for platform-owned catalogue. */
    public function merchant()
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subCategory()
    {
        return $this->belongsTo(SubCategory::class);
    }

    public function supplierProducts()
    {
        return $this->hasMany(SupplierProduct::class);
    }
}
