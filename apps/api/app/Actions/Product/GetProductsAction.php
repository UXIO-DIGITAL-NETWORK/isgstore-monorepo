<?php

namespace App\Actions\Product;

use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

class GetProductsAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return Product::with(['category', 'subCategory'])->latest()->paginate($perPage);
    }
}
