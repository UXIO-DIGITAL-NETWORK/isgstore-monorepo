<?php

namespace App\Actions\Order;

use App\Models\Order;
use Illuminate\Pagination\LengthAwarePaginator;

class GetOrdersAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return Order::with(['user', 'product', 'supplier', 'payment'])->latest()->paginate($perPage);
    }
}
