<?php

namespace App\Actions\Supplier;

use App\Models\SupplierCategory;
use Illuminate\Pagination\LengthAwarePaginator;

class GetSupplierCategoriesAction
{
    public function execute(
        int $perPage = 15,
        ?int $categoryId = null,
        ?int $supplierId = null,
        ?string $search = null,
    ): LengthAwarePaginator {
        return SupplierCategory::with(['category', 'supplier'])
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->when($supplierId, fn ($query) => $query->where('supplier_id', $supplierId))
            // The admin list shows the supplier's name, so a search that only
            // matched template_code would miss the column people actually read.
            ->when($search, fn ($query) => $query->where(
                fn ($query) => $query->where('template_code', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('category', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ))
            ->latest()
            ->paginate($perPage);
    }
}
