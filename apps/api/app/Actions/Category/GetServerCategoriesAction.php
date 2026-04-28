<?php

namespace App\Actions\Category;

use App\Models\ServerCategory;
use Illuminate\Pagination\LengthAwarePaginator;

class GetServerCategoriesAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return ServerCategory::with('category')->latest()->paginate($perPage);
    }
}
