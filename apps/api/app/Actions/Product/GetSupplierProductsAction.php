<?php

namespace App\Actions\Product;

use App\Models\SupplierProduct;
use App\Services\PricingService;
use Illuminate\Pagination\LengthAwarePaginator;

class GetSupplierProductsAction
{
    public function __construct(private readonly PricingService $pricing) {}

    /**
     * @param  array{ids?:string|array<int|string>,search?:string,supplier_id?:int,category_id?:int,status?:string,mode?:string,pool_state?:string,availability?:string,min_cost?:int,max_cost?:int}  $filters
     */
    public function execute(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = SupplierProduct::with(['product.category', 'supplier', 'poolCategory'])->latest();

        // Explicit id selection, used by the Set Profit Margin page. Without it that
        // page has to pull a whole page and narrow the selection client-side, which
        // silently drops any row that fell outside the fetched page.
        if (! empty($filters['ids'])) {
            $ids = is_array($filters['ids'])
                ? $filters['ids']
                : explode(',', (string) $filters['ids']);

            $ids = array_values(array_filter(array_map('intval', $ids)));

            // An ids filter that parses to nothing must return nothing, not everything.
            $query->whereIn('id', $ids ?: [0]);
        }

        if (! empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(function ($q) use ($term) {
                $q->where('buyer_sku_code', 'like', "%{$term}%")
                    // A pooled row has no product, so its own snapshot name is the
                    // only thing an admin can search it by.
                    ->orWhere('provider_name', 'like', "%{$term}%")
                    ->orWhereHas('product', fn ($p) => $p->where('name', 'like', "%{$term}%")->orWhere('code', 'like', "%{$term}%"));
            });
        }

        if (! empty($filters['supplier_id'])) {
            $query->where('supplier_id', (int) $filters['supplier_id']);
        }

        // Match on the product's category once promoted, or the category it was
        // pooled for while it is not. A plain whereHas('product') would make every
        // pooled row invisible the moment a category filter is applied.
        if (! empty($filters['category_id'])) {
            $categoryId = (int) $filters['category_id'];
            $query->where(fn ($q) => $q
                ->whereHas('product', fn ($p) => $p->where('category_id', $categoryId))
                ->orWhere(fn ($pooled) => $pooled
                    ->whereNull('product_id')
                    ->where('pool_category_id', $categoryId)));
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('is_active', $filters['status'] === 'active');
        }

        // "auto" = prices track the supplier sync; "manual" = price is locked.
        if (isset($filters['mode']) && $filters['mode'] !== '') {
            $query->where('is_price_locked', $filters['mode'] === 'manual');
        }

        // Where the row sits in the pipeline. Mirrors SupplierProduct::poolState();
        // the two must agree or a filter would hide rows the badge says are there.
        match ($filters['pool_state'] ?? null) {
            SupplierProduct::STATE_NEEDS_MARGIN => $query->whereNull('product_id')->whereNull('margin_set_at'),
            SupplierProduct::STATE_READY => $query->whereNull('product_id')->whereNotNull('margin_set_at'),
            SupplierProduct::STATE_DRAFT => $query->whereNotNull('product_id')
                ->whereHas('product', fn ($p) => $p->where('status', false)),
            SupplierProduct::STATE_PUBLISHED => $query->whereNotNull('product_id')
                ->whereHas('product', fn ($p) => $p->where('status', true)),
            default => null,
        };

        // Availability upstream, which is not the same thing as our is_active.
        if (isset($filters['availability']) && $filters['availability'] !== '') {
            $query->where('buyer_product_status', $filters['availability'] === 'available');
        }

        if (isset($filters['min_cost']) && $filters['min_cost'] !== '') {
            $query->where('price', '>=', (int) $filters['min_cost']);
        }

        if (isset($filters['max_cost']) && $filters['max_cost'] !== '') {
            $query->where('price', '<=', (int) $filters['max_cost']);
        }

        $paginator = $query->paginate($perPage);

        $this->attachPreviewPrices($paginator);

        return $paginator;
    }

    /**
     * A pooled row has no product, so it has no stored selling prices — the admin
     * table would show zeroes. Project what the prices *would* be from the cost and
     * the decided margins.
     *
     * Computed here, once per page, on purpose: PricingService memoises its rules
     * per instance, so doing this inside the Resource would resolve a fresh service
     * (and re-query pricing_rules) for every row.
     */
    private function attachPreviewPrices(LengthAwarePaginator $paginator): void
    {
        foreach ($paginator->items() as $row) {
            if ($row->product_id !== null) {
                continue;
            }

            $margins = array_filter([
                'member' => $row->margin_member,
                'vip' => $row->margin_vip,
                'reseller' => $row->margin_reseller,
                'agent' => $row->margin_agent,
            ], fn ($margin) => $margin !== null);

            $row->setAttribute('preview_prices', $this->pricing->computePrices(
                (int) $row->price,
                $row->pool_category_id,
                $margins,
                $row->price_min,
                $row->price_max,
            ));
        }
    }
}
