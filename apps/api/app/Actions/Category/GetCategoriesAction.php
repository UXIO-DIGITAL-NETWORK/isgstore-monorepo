<?php

namespace App\Actions\Category;

use App\Models\Category;
use Illuminate\Pagination\LengthAwarePaginator;

class GetCategoriesAction
{
    public function execute(int $perPage = 15, ?string $search = null, ?int $typeId = null): LengthAwarePaginator
    {
        return Category::with('categoryType')
            ->when($search, fn ($query) => $query->where(
                fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%")
            ))
            ->when($typeId, fn ($query) => $query->where('type_id', $typeId))
            ->latest()
            ->paginate($perPage);
    }
}
