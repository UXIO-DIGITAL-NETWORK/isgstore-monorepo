<?php

namespace App\Actions\Rating;

use App\Models\Rating;
use Illuminate\Pagination\LengthAwarePaginator;

class GetRatingsAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        // `transaction.product` is pulled so the admin list can show which game
        // each review is about; `user` is null for guest reviews (guest_name is
        // shown instead). Note: the relation is `transaction`, not `order`.
        return Rating::with(['user', 'transaction.product'])->latest()->paginate($perPage);
    }
}
