<?php

namespace App\Actions\Transaction;

use App\Models\Transaction;
use Illuminate\Pagination\LengthAwarePaginator;

class GetTransactionsAction
{
    /** Whitelisted to real, indexed-friendly columns — never interpolate a raw sort_by from the request. */
    private const SORTABLE_COLUMNS = ['invoice_number', 'amount_total', 'status', 'created_at'];

    public function execute(
        int $perPage,
        ?string $status,
        ?string $search,
        ?int $userId = null,
        ?int $productId = null,
        ?int $paymentChannelId = null,
        ?string $startDate = null,
        ?string $endDate = null,
        ?string $sortBy = null,
        string $sortDir = 'desc',
    ): LengthAwarePaginator {
        $sortColumn = in_array($sortBy, self::SORTABLE_COLUMNS, true) ? $sortBy : 'created_at';
        $sortDirection = strtolower($sortDir) === 'asc' ? 'asc' : 'desc';

        return Transaction::query()
            ->with(['user', 'product.category', 'supplier', 'payment', 'paymentChannel'])
            ->when($status, fn ($q) => $q->where('status', $status))
            // The admin table's search box sits above both the invoice and the
            // customer column, so matching only the invoice number made a
            // name search look like "no results" rather than "not supported".
            // Guests have no user row — their contact is on the transaction.
            ->when($search, fn ($q) => $q->where(
                fn ($q) => $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('guest_contact', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%"))
            ))
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->when($productId, fn ($q) => $q->where('product_id', $productId))
            ->when($paymentChannelId, fn ($q) => $q->where('payment_channel_id', $paymentChannelId))
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage);
    }
}
