<?php

namespace App\Actions\Category;

use App\Models\ServerCategory;
use Illuminate\Pagination\LengthAwarePaginator;

class GetServerCategoriesAction
{
    /** `options` is eager-loaded so the admin list can render each server's
     * option set without an N+1 round trip per row. */
    public function execute(int $perPage = 15, ?int $categoryId = null, ?string $search = null): LengthAwarePaginator
    {
        return ServerCategory::with(['category', 'options'])
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate($perPage);
    }
}
