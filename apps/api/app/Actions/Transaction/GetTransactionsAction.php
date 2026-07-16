<?php

namespace App\Actions\Transaction;

use App\Models\Transaction;
use Illuminate\Pagination\LengthAwarePaginator;

class GetTransactionsAction
{
    public function execute(
        int $perPage,
        ?string $status,
        ?string $search,
        ?int $userId = null,
        ?int $productId = null,
        ?int $paymentChannelId = null,
        ?string $startDate = null,
        ?string $endDate = null,
    ): LengthAwarePaginator {
        return Transaction::query()
            ->with(['user', 'product', 'supplier', 'payment', 'paymentChannel'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search, fn ($q) => $q->where('invoice_number', 'like', "%{$search}%"))
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->when($productId, fn ($q) => $q->where('product_id', $productId))
            ->when($paymentChannelId, fn ($q) => $q->where('payment_channel_id', $paymentChannelId))
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->latest()
            ->paginate($perPage);
    }
}
