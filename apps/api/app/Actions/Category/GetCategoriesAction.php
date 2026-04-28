<?php

namespace App\Actions\Category;

use App\Models\Category;
use Illuminate\Pagination\LengthAwarePaginator;

class GetCategoriesAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return Category::with('categoryType')->latest()->paginate($perPage);
    }
}
