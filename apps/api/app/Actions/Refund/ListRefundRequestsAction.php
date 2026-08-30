<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\DTOs\Refund\ListRefundRequestsDTO;
use App\Models\RefundRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * The admin refund queue.
 *
 * Search spans the four handles an admin is ever given over the phone or in a
 * ticket: the refund number, the invoice number, the customer's email and
 * their phone. Unlike the public lookup this is a LIKE search — the caller is
 * already an authenticated admin, so there is no table to walk that they
 * cannot simply list.
 */
class ListRefundRequestsAction
{
    public function execute(ListRefundRequestsDTO $dto): LengthAwarePaginator
    {
        $search = $dto->search !== null ? trim($dto->search) : null;

        return RefundRequest::query()
            ->with([
                'transaction:id,invoice_number,product_id,user_id,created_at',
                'transaction.product:id,name',
                'user:id,name,email,phone',
                'processedBy:id,name',
            ])
            ->when($dto->status, fn (Builder $q, string $status) => $q->where('status', $status))
            ->when($dto->method, fn (Builder $q, string $method) => $q->where('method', $method))
            ->when($search !== null && $search !== '', fn (Builder $q) => $q->where(
                fn (Builder $inner) => $inner
                    ->where('refund_number', 'like', "%{$search}%")
                    ->orWhere('contact_email', 'like', "%{$search}%")
                    ->orWhere('contact_phone', 'like', "%{$search}%")
                    ->orWhereHas('transaction', fn (Builder $t) => $t->where('invoice_number', 'like', "%{$search}%"))
            ))
            ->when($dto->startDate, fn (Builder $q, string $from) => $q->where('created_at', '>=', $from))
            ->when($dto->endDate, fn (Builder $q, string $to) => $q->where('created_at', '<=', $to))
            ->latest('id')
            ->paginate($dto->perPage);
    }

    /**
     * Counts per status for the queue's filter pills, so the admin can see at a
     * glance how many refunds are actually waiting on them.
     *
     * @return array<string, int>
     */
    public function statusCounts(): array
    {
        return RefundRequest::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($n) => (int) $n)
            ->all();
    }
}
