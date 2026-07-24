<?php

namespace App\Actions\Category;

use App\Models\SubCategory;
use Illuminate\Pagination\LengthAwarePaginator;

class GetSubCategoriesAction
{
    public function execute(int $perPage = 15, ?int $categoryId = null): LengthAwarePaginator
    {
        return SubCategory::with('category')
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->latest()
            ->paginate($perPage);
    }
}
