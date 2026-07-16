<?php

namespace App\Actions\Supplier;

use App\Models\SupplierCategory;
use Illuminate\Pagination\LengthAwarePaginator;

class GetSupplierCategoriesAction
{
    public function execute(int $perPage = 15, ?int $categoryId = null, ?int $supplierId = null): LengthAwarePaginator
    {
        return SupplierCategory::with(['category', 'supplier'])
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->when($supplierId, fn ($query) => $query->where('supplier_id', $supplierId))
            ->latest()
            ->paginate($perPage);
    }
}
