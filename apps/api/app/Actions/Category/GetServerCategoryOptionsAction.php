<?php

namespace App\Actions\Category;

use App\Models\ServerCategoryOption;
use Illuminate\Pagination\LengthAwarePaginator;

class GetServerCategoryOptionsAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return ServerCategoryOption::with('serverCategory')->latest()->paginate($perPage);
    }
}
