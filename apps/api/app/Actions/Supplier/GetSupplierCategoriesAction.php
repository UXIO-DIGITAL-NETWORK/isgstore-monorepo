<?php

namespace App\Actions\Supplier;

use App\Models\SupplierCategory;
use Illuminate\Pagination\LengthAwarePaginator;

class GetSupplierCategoriesAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return SupplierCategory::with(['category', 'supplier'])->latest()->paginate($perPage);
    }
}
