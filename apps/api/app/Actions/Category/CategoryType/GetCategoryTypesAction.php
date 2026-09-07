<?php

namespace App\Actions\Category\CategoryType;

use App\Models\CategoryType;
use Illuminate\Pagination\LengthAwarePaginator;

class GetCategoryTypesAction
{
    public function execute(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        return CategoryType::query()
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate($perPage);
    }
}
