<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierProduct extends Model
{
    use HasFactory;

    /** Pooled: pulled in from the provider, no selling price decided yet. */
    public const STATE_NEEDS_MARGIN = 'needs_margin';

    /** Pooled and priced — eligible for promotion into the catalogue. */
    public const STATE_READY = 'ready';

    /** Promoted to a Product that has never been published. */
    public const STATE_DRAFT = 'draft';

    /** Promoted and live on the storefront. */
    public const STATE_PUBLISHED = 'published';

    protected $guarded = ['id'];

    protected $casts = [
        'sync_deactivated_at' => 'datetime',
        'margin_set_at' => 'datetime',
        'is_price_locked' => 'boolean',
        'margin_member' => 'float',
        'margin_vip' => 'float',
        'margin_reseller' => 'float',
        'margin_agent' => 'float',
        'price_min' => 'integer',
        'price_max' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * The category this SKU is destined for while it is still in the pool. Once
     * promoted, `product->category_id` is authoritative and this is the record of
     * what it was pooled as.
     */
    public function poolCategory()
    {
        return $this->belongsTo(Category::class, 'pool_category_id');
    }

    /**
     * The single definition of where this mapping sits in the pipeline.
     *
     * Derived from `product_id` (pooled vs promoted), `margin_set_at` (priced or
     * not) and the product's own `status` (draft vs published). Never re-derive
     * these inline — the promote/publish guards and the admin badges must agree.
     */
    public function poolState(): string
    {
        if ($this->product_id === null) {
            return $this->margin_set_at === null ? self::STATE_NEEDS_MARGIN : self::STATE_READY;
        }

        return $this->product?->status ? self::STATE_PUBLISHED : self::STATE_DRAFT;
    }

    /** Null when the SKU may be promoted; otherwise the reason it may not be. */
    public function promoteBlockedReason(): ?string
    {
        if ($this->product_id !== null) {
            return 'SKU sudah dipromosikan ke produk utama.';
        }

        if ($this->margin_set_at === null) {
            return 'Set profit margin terlebih dahulu sebelum promote.';
        }

        if ($this->pool_category_id === null) {
            return 'Kategori provider belum dipetakan.';
        }

        return null;
    }

    public function canPromote(): bool
    {
        return $this->promoteBlockedReason() === null;
    }

    /** Still in the pool — no product behind it. */
    public function scopePooled(Builder $query): Builder
    {
        return $query->whereNull('product_id');
    }

    /** Already turned into a Product (draft or published). */
    public function scopePromoted(Builder $query): Builder
    {
        return $query->whereNotNull('product_id');
    }

    /** Pooled and priced — what the Promote action will accept. */
    public function scopeReady(Builder $query): Builder
    {
        return $query->whereNull('product_id')->whereNotNull('margin_set_at');
    }
}
