<?php

namespace App\Actions\Banner;

use App\Models\Banner;
use Illuminate\Pagination\LengthAwarePaginator;

class GetBannersAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return Banner::with('category')->latest()->paginate($perPage);
    }
}
