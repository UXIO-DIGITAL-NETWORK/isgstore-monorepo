<?php

namespace App\Actions\Dashboard;

use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Support\Collection;

/**
 * Top-N performers by revenue for the dashboard's Category/Product/User
 * tabs. `revenue` only counts COMPLETED transactions (matches
 * GetDashboardStatsAction's convention); `total_transaction` counts every
 * transaction regardless of status (orders placed, not just fulfilled).
 */
class GetDashboardPerformanceAction
{
    private const LIMIT = 10;

    public function execute(string $tab): array
    {
        return match ($tab) {
            'category' => $this->byCategory(),
            'product' => $this->byProduct(),
            'user' => $this->byUser(),
            default => [],
        };
    }

    private function byCategory(): array
    {
        $completed = TransactionStatus::COMPLETED->value;

        return Transaction::query()
            ->join('products', 'products.id', '=', 'transactions.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->leftJoin('category_types', 'category_types.id', '=', 'categories.type_id')
            ->selectRaw(
                'categories.id as id, categories.name as name, category_types.name as sub_label, '.
                'COUNT(*) as total_transaction, '.
                'COALESCE(SUM(CASE WHEN transactions.status = ? THEN transactions.amount_total ELSE 0 END),0) as revenue',
                [$completed]
            )
            ->groupBy('categories.id', 'categories.name', 'category_types.name')
            ->orderByDesc('revenue')
            ->limit(self::LIMIT)
            ->get()
            ->pipe(fn (Collection $rows) => $this->mapRows($rows));
    }

    private function byProduct(): array
    {
        $completed = TransactionStatus::COMPLETED->value;

        return Transaction::query()
            ->join('products', 'products.id', '=', 'transactions.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->selectRaw(
                'products.id as id, products.name as name, categories.name as sub_label, '.
                'COUNT(*) as total_transaction, '.
                'COALESCE(SUM(CASE WHEN transactions.status = ? THEN transactions.amount_total ELSE 0 END),0) as revenue',
                [$completed]
            )
            ->groupBy('products.id', 'products.name', 'categories.name')
            ->orderByDesc('revenue')
            ->limit(self::LIMIT)
            ->get()
            ->pipe(fn (Collection $rows) => $this->mapRows($rows));
    }

    private function byUser(): array
    {
        $completed = TransactionStatus::COMPLETED->value;

        return Transaction::query()
            ->join('users', 'users.id', '=', 'transactions.user_id')
            ->whereNotNull('transactions.user_id')
            ->selectRaw(
                'users.id as id, users.name as name, users.email as sub_label, '.
                'COUNT(*) as total_transaction, '.
                'COALESCE(SUM(CASE WHEN transactions.status = ? THEN transactions.amount_total ELSE 0 END),0) as revenue',
                [$completed]
            )
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc('revenue')
            ->limit(self::LIMIT)
            ->get()
            ->pipe(fn (Collection $rows) => $this->mapRows($rows));
    }

    /**
     * @return array<int,array{id:int,name:string,sub_label:?string,total_transaction:int,revenue:int}>
     */
    private function mapRows(Collection $rows): array
    {
        return $rows->map(fn ($row) => [
            'id' => (int) $row->id,
            'name' => $row->name,
            'sub_label' => $row->sub_label,
            'total_transaction' => (int) $row->total_transaction,
            'revenue' => (int) $row->revenue,
        ])->all();
    }
}
