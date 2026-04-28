<?php

namespace App\Actions\Supplier;

use App\Models\Supplier;
use Illuminate\Pagination\LengthAwarePaginator;

class GetSuppliersAction
{
    public function execute(int $perPage = 15): LengthAwarePaginator
    {
        return Supplier::latest()->paginate($perPage);
    }
}
