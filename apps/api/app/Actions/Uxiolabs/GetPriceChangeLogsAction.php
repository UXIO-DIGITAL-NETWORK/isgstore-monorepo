<?php

namespace App\Actions\Uxiolabs;

use App\DTOs\Uxiolabs\GetPriceChangeLogsDTO;
use App\Models\PriceChangeLog;
use Illuminate\Pagination\LengthAwarePaginator;

class GetPriceChangeLogsAction
{
    public function execute(GetPriceChangeLogsDTO $dto): LengthAwarePaginator
    {
        return PriceChangeLog::query()
            ->when(
                $dto->status && $dto->status !== 'all',
                fn ($q) => $q->where('status', $dto->status)
            )
            ->when($dto->search, fn ($q) => $q->where(fn ($w) => $w
                ->where('product_name', 'like', "%{$dto->search}%")
                ->orWhere('buyer_sku_code', 'like', "%{$dto->search}%")
            ))
            ->when($dto->dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dto->dateFrom))
            ->when($dto->dateTo, fn ($q) => $q->whereDate('created_at', '<=', $dto->dateTo))
            ->latest()
            ->paginate($dto->perPage);
    }
}
