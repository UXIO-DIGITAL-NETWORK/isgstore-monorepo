<?php

namespace App\Actions\Category;

use App\Models\ServerCategory;
use Illuminate\Pagination\LengthAwarePaginator;

class GetServerCategoriesAction
{
    public function execute(int $perPage = 15, ?int $categoryId = null): LengthAwarePaginator
    {
        return ServerCategory::with('category')
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->latest()
            ->paginate($perPage);
    }
}
