<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\DTOs\Storefront\ListGamesDTO;
use App\Enums\TransactionStatus;
use App\Support\Storefront\Catalog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ListGamesAction
{
    public function execute(ListGamesDTO $dto): LengthAwarePaginator
    {
        $query = Catalog::sellableGames()->with('categoryType:id,name');

        if ($dto->search) {
            $term = '%'.str_replace('%', '\%', $dto->search).'%';
            $query->where(fn (Builder $q) => $q
                ->where('name', 'like', $term)
                ->orWhere('sub_name', 'like', $term)
                ->orWhere('code', 'like', $term)
            );
        }

        if ($dto->typeId) {
            $query->where('type_id', $dto->typeId);
        }

        if ($dto->sort === 'popular') {
            // Popularity = completed orders. withCount subquery rather than a
            // join, so the sellable-game whereHas above is not disturbed.
            $query
                ->withCount(['products as completed_orders_count' => fn (Builder $q) => $q
                    ->join('transactions', 'transactions.product_id', '=', 'products.id')
                    ->where('transactions.status', TransactionStatus::COMPLETED->value),
                ])
                ->orderByDesc('completed_orders_count');
        }

        return $query->orderBy('name')->paginate($dto->perPage);
    }
}
