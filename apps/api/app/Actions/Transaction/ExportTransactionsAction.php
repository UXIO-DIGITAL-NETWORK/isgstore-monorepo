<?php

namespace App\Actions\Transaction;

use App\Models\Transaction;
use Illuminate\Support\Collection;

/**
 * The unpaginated twin of GetTransactionsAction: the same filters, every
 * matching row, for a CSV export. Kept separate so the list endpoint keeps its
 * paginator and the export never accidentally pages.
 */
class ExportTransactionsAction
{
    public function execute(
        ?string $status = null,
        ?string $search = null,
        ?int $userId = null,
        ?int $productId = null,
        ?int $paymentChannelId = null,
        ?string $startDate = null,
        ?string $endDate = null,
        ?string $providerStatus = null,
        ?string $paymentStatus = null,
    ): Collection {
        return Transaction::query()
            ->with(['user', 'product', 'paymentChannel', 'payment'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($providerStatus, fn ($q) => $q->where('provider_status', $providerStatus))
            ->when($paymentStatus === GetTransactionsAction::PAYMENT_STATUS_NONE, fn ($q) => $q->doesntHave('payment'))
            ->when($paymentStatus && $paymentStatus !== GetTransactionsAction::PAYMENT_STATUS_NONE, function ($q) use ($paymentStatus) {
                $code = GetTransactionsAction::paymentCodeFor($paymentStatus);
                $q->whereHas('payment', fn ($p) => $p->where('status', $code ?? '__none__'));
            })
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
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
