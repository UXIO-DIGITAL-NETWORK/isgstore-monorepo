<?php

namespace App\Actions\Transaction;

use App\Models\Transaction;
use Illuminate\Pagination\LengthAwarePaginator;

class GetTransactionsAction
{
    public function execute(int $perPage, ?string $status, ?string $search): LengthAwarePaginator
    {
        return Transaction::query()
            ->with(['user', 'product', 'supplier', 'payment', 'paymentChannel'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search, fn ($q) => $q->where('invoice_number', 'like', "%{$search}%"))
            ->latest()
            ->paginate($perPage);
    }
}
