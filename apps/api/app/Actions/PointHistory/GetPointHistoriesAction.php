<?php

namespace App\Actions\PointHistory;

use App\Models\PointHistory;
use Illuminate\Pagination\LengthAwarePaginator;

class GetPointHistoriesAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return PointHistory::with(['user', 'order'])->latest()->paginate($perPage);
    }
}
