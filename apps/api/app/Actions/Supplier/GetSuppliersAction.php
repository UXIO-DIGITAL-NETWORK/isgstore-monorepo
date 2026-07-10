<?php

namespace App\Actions\Supplier;

use App\Models\Supplier;
use Illuminate\Pagination\LengthAwarePaginator;

class GetSuppliersAction
{
    public function execute(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        return Supplier::query()
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate($perPage);
    }
}
