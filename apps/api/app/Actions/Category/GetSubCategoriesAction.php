<?php

namespace App\Actions\Category;

use App\Models\SubCategory;
use Illuminate\Pagination\LengthAwarePaginator;

class GetSubCategoriesAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return SubCategory::with('category')->latest()->paginate($perPage);
    }
}
