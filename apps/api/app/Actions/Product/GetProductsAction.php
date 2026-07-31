<?php

namespace App\Actions\Product;

use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

class GetProductsAction
{
    /**
     * Filters mirror the admin product list's toolbar: a free-text box over
     * name/code, the category and sub-category selects, a status filter and a
     * price band on the retail (member) price.
     */
    public function execute(
        int $perPage = 15,
        ?string $search = null,
        ?int $categoryId = null,
        ?int $subCategoryId = null,
        ?bool $status = null,
        ?int $minPrice = null,
        ?int $maxPrice = null,
    ): LengthAwarePaginator {
        return Product::with(['category', 'subCategory'])
            ->when($search, fn ($query) => $query->where(
                fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%")
            ))
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->when($subCategoryId, fn ($query) => $query->where('sub_category_id', $subCategoryId))
            // Explicit null check: `false` is a meaningful filter value here, so
            // `when($status, ...)` would silently drop "inactive only".
            ->when($status !== null, fn ($query) => $query->where('status', $status))
            ->when($minPrice, fn ($query) => $query->where('price_member', '>=', $minPrice))
            ->when($maxPrice, fn ($query) => $query->where('price_member', '<=', $maxPrice))
            ->latest()
            ->paginate($perPage);
    }
}
