<?php

namespace App\Actions\Product;

use App\Models\Product;

/**
 * Applies a Main Products action across a selection, reusing the single-row
 * actions so logging and price recomputation stay identical.
 */
class BulkProductAction
{
    public function __construct(
        private ProductPriceControlAction $priceControl,
        private DeleteProductAction $deleteAction,
    ) {}

    /**
     * @param  int[]  $ids
     * @return array{updated:int}
     */
    public function lock(array $ids, bool $locked): array
    {
        return $this->each($ids, fn (Product $p) => $this->priceControl->lock($p, $locked));
    }

    /**
     * @param  int[]  $ids
     * @return array{updated:int}
     */
    public function hide(array $ids, bool $hidden): array
    {
        return $this->each($ids, fn (Product $p) => $this->priceControl->hide($p, $hidden));
    }

    /**
     * @param  int[]  $ids
     * @return array{updated:int}
     */
    public function deactivate(array $ids): array
    {
        return $this->each($ids, fn (Product $p) => $p->update(['status' => false]));
    }

    /**
     * @param  int[]  $ids
     * @return array{updated:int}
     */
    public function digiflazzUpdate(array $ids): array
    {
        return $this->each($ids, fn (Product $p) => $this->priceControl->digiflazzUpdate($p));
    }

    /**
     * @param  int[]  $ids
     * @return array{deleted:int}
     */
    public function delete(array $ids): array
    {
        $rows = Product::whereIn('id', $ids)->get();
        foreach ($rows as $row) {
            $this->deleteAction->execute($row);
        }

        return ['deleted' => $rows->count()];
    }

    /**
     * @param  int[]  $ids
     * @return array{updated:int}
     */
    private function each(array $ids, callable $fn): array
    {
        $rows = Product::whereIn('id', $ids)->get();
        foreach ($rows as $row) {
            $fn($row);
        }

        return ['updated' => $rows->count()];
    }
}
