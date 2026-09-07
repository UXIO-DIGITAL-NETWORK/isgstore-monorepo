<?php

declare(strict_types=1);

namespace App\Actions\Member;

use App\DTOs\Member\ListMemberTransactionsDTO;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * The signed-in customer's own order history.
 *
 * Every query is scoped to `user_id` at the start, so no filter combination can
 * widen it to another customer's rows.
 */
class ListMemberTransactionsAction
{
    public function execute(User $user, ListMemberTransactionsDTO $dto): LengthAwarePaginator
    {
        $query = $this->baseQuery($user);

        if ($dto->status) {
            $query->where('status', $dto->status);
        }

        if ($dto->paymentChannelId) {
            $query->where('payment_channel_id', $dto->paymentChannelId);
        }

        if ($dto->dateFrom) {
            $query->whereDate('created_at', '>=', $dto->dateFrom);
        }

        if ($dto->dateTo) {
            $query->whereDate('created_at', '<=', $dto->dateTo);
        }

        if ($dto->search) {
            $term = '%'.str_replace('%', '\%', $dto->search).'%';
            $query->where(fn (Builder $q) => $q
                ->where('invoice_number', 'like', $term)
                ->orWhereHas('product', fn (Builder $p) => $p->where('name', 'like', $term))
            );
        }

        match ($dto->sort) {
            'oldest' => $query->oldest('id'),
            'priceHigh' => $query->orderByDesc('amount_total'),
            'priceLow' => $query->orderBy('amount_total'),
            default => $query->latest('id'),
        };

        return $query->paginate($dto->perPage)->through($this->row(...));
    }

    /** @return list<array<string, mixed>> */
    public function recent(User $user, int $limit): array
    {
        return $this->baseQuery($user)
            ->latest('id')
            ->limit($limit)
            ->get()
            ->map($this->row(...))
            ->values()
            ->all();
    }

    private function baseQuery(User $user): Builder
    {
        return Transaction::query()
            ->where('user_id', $user->id)
            ->with([
                'product:id,category_id,name',
                'product.category:id,name,slug,code,logo',
                'paymentChannel:id,name,channel_code,payment_type',
            ]);
    }

    /** Field-by-field: margin and supplier ids must never reach the customer. */
    private function row(Transaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'invoice_number' => $transaction->invoice_number,
            'service_name' => $transaction->product?->category?->name,
            'service_detail' => $transaction->product?->name,
            'target' => trim($transaction->target_uid.($transaction->target_server ? '-'.$transaction->target_server : '')),
            'target_nickname' => $transaction->target_nickname,
            'amount' => (int) $transaction->amount_total,
            // Fee breakdown for transparency (customer never sees margin/supplier).
            'base' => (int) $transaction->amount_base,
            'admin_fee' => (int) $transaction->channel_fee,
            'status' => $transaction->status?->value,
            'payment_method' => $transaction->paymentChannel?->payment_type,
            'payment_channel' => $transaction->paymentChannel?->name,
            'sn' => $transaction->sn,
            'created_at' => $transaction->created_at?->toIso8601String(),
        ];
    }
}
