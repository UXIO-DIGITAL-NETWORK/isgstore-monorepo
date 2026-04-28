<?php

namespace App\Actions\Rating;

use App\Models\Rating;
use Illuminate\Pagination\LengthAwarePaginator;

class GetRatingsAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return Rating::with(['order', 'user'])->latest()->paginate($perPage);
    }
}
