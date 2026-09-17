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
        // The day's selling allowance; null = unlimited. See DailyStockLimit.
        'daily_order_limit' => 'integer',
    ];

    /** Authored margin per membership plan — see `SupplierProductMargin`. */
    public function planMargins()
    {
        return $this->hasMany(SupplierProductMargin::class);
    }

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
     * not) and both halves of "live" (draft vs published). Never re-derive these
     * inline — the promote/publish guards and the admin badges must agree.
     *
     * PUBLISHED means exactly what `Catalog::sellableProducts()` means: the
     * product is active AND this mapping is the active one. Reading `status`
     * alone stranded rows — flipping a draft product active from the Main
     * Products list made this report PUBLISHED while the storefront still could
     * not see it, and the row menu hides Publish on anything not DRAFT, so there
     * was no way back. A promoted-but-not-live mapping is a draft, whether it is
     * waiting for its first publish or was superseded by a sibling supplier.
     */
    public function poolState(): string
    {
        if ($this->product_id === null) {
            return $this->margin_set_at === null ? self::STATE_NEEDS_MARGIN : self::STATE_READY;
        }

        return $this->product?->status && $this->is_active
            ? self::STATE_PUBLISHED
            : self::STATE_DRAFT;
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
