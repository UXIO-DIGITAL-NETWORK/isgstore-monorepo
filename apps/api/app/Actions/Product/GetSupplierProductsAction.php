<?php

namespace App\Actions\Product;

use App\Models\SupplierProduct;
use Illuminate\Pagination\LengthAwarePaginator;

class GetSupplierProductsAction
{
    /**
     * @param  array{search?:string,supplier_id?:int,category_id?:int,status?:string,mode?:string}  $filters
     */
    public function execute(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = SupplierProduct::with(['product.category', 'supplier'])->latest();

        if (! empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(function ($q) use ($term) {
                $q->where('buyer_sku_code', 'like', "%{$term}%")
                    ->orWhereHas('product', fn ($p) => $p->where('name', 'like', "%{$term}%")->orWhere('code', 'like', "%{$term}%"));
            });
        }

        if (! empty($filters['supplier_id'])) {
            $query->where('supplier_id', (int) $filters['supplier_id']);
        }

        if (! empty($filters['category_id'])) {
            $categoryId = (int) $filters['category_id'];
            $query->whereHas('product', fn ($p) => $p->where('category_id', $categoryId));
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('is_active', $filters['status'] === 'active');
        }

        // "auto" = prices track the supplier sync; "manual" = price is locked.
        if (isset($filters['mode']) && $filters['mode'] !== '') {
            $query->where('is_price_locked', $filters['mode'] === 'manual');
        }

        return $query->paginate($perPage);
    }
}
