<?php

namespace App\Actions\Uxiotopup;

use App\Models\PriceChangeAlert;
use Illuminate\Pagination\LengthAwarePaginator;

class GetPriceAlertsAction
{
    public function execute(?string $status = null, int $perPage = 15): LengthAwarePaginator
    {
        return PriceChangeAlert::with('supplierProduct.product')
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate($perPage);
    }
}
