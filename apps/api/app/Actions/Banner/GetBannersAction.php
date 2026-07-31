<?php

namespace App\Actions\Banner;

use App\Models\Banner;
use Illuminate\Pagination\LengthAwarePaginator;

class GetBannersAction
{
    public function execute(int $perPage = 15, ?string $search = null, ?int $categoryId = null): LengthAwarePaginator
    {
        return Banner::with('category')
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->latest()
            ->paginate($perPage);
    }
}
