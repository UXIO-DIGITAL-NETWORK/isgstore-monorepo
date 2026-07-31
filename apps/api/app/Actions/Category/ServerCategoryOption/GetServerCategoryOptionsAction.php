<?php

namespace App\Actions\Category\ServerCategoryOption;

use App\Models\ServerCategoryOption;
use Illuminate\Pagination\LengthAwarePaginator;

class GetServerCategoryOptionsAction
{
    public function execute(int $perPage = 15, ?int $serverCategoryId = null, ?string $search = null): LengthAwarePaginator
    {
        return ServerCategoryOption::with('serverCategory')
            ->when($serverCategoryId, fn ($query) => $query->where('server_category_id', $serverCategoryId))
            ->when($search, fn ($query) => $query->where(
                fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('value', 'like', "%{$search}%")
            ))
            ->latest()
            ->paginate($perPage);
    }
}
