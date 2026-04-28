<?php

namespace App\Actions\Product;

use App\Models\SupplierProduct;
use Illuminate\Pagination\LengthAwarePaginator;

class GetSupplierProductsAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return SupplierProduct::with(['product', 'supplier'])->latest()->paginate($perPage);
    }
}
