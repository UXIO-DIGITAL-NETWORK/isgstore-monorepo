<?php

namespace App\Actions\Category\CategoryType;

use App\Models\CategoryType;
use Illuminate\Pagination\LengthAwarePaginator;

class GetCategoryTypesAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return CategoryType::latest()->paginate($perPage);
    }
}
