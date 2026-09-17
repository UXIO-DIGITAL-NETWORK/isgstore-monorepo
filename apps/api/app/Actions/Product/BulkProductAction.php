<?php

namespace App\Actions\Product;

use App\Exceptions\SupplierProductPoolException;
use App\Models\Product;
use Throwable;

/**
 * Applies a Main Products action across a selection, reusing the single-row
 * actions so logging and price recomputation stay identical.
 */
class BulkProductAction
{
    public function __construct(
        private ProductPriceControlAction $priceControl,
        private DeleteProductAction $deleteAction,
        private PublishProductAction $publishAction,
        private UnpublishProductAction $unpublishAction,
    ) {}

    /**
     * @param  int[]  $ids
     * @return array{updated:int}
     */
    public function hide(array $ids, bool $hidden): array
    {
        return $this->each($ids, fn (Product $p) => $this->priceControl->hide($p, $hidden));
    }

    /**
     * Publish or unpublish a selection.
     *
     * Skips per row rather than failing the batch — a single SKU the provider has
     * switched off must not cost the admin the other forty-nine. Mirrors
     * BulkSupplierProductAction::publish, whose shape the admin's partial-success
     * toast already understands.
     *
     * @param  int[]  $ids
     * @return array{updated:int, skipped:array<int,array{id:int,code:string,reason:string}>}
     */
    public function setPublished(array $ids, bool $published): array
    {
        $rows = Product::with('supplierProducts')->whereIn('id', $ids)->get();
        $updated = 0;
        $skipped = [];

        foreach ($rows as $row) {
            try {
                $published
                    ? $this->publishAction->execute($row)
                    : $this->unpublishAction->execute($row);
                $updated++;
            } catch (SupplierProductPoolException $e) {
                $skipped[] = ['id' => $row->id, 'code' => (string) $row->code, 'reason' => $e->getMessage()];
            }
        }

        return ['updated' => $updated, 'skipped' => $skipped];
    }

    /**
     * @param  int[]  $ids
     * @return array{updated:int}
     */
    public function uxiolabsUpdate(array $ids): array
    {
        return $this->each($ids, fn (Product $p) => $this->priceControl->uxiolabsUpdate($p));
    }

    /**
     * @param  int[]  $ids
     * @return array{deleted:int}
     */
    public function delete(array $ids): array
    {
        $rows = Product::whereIn('id', $ids)->get();
        $deleted = 0;
        $skipped = [];

        // Per-row isolation: each execute() owns its own transaction, so one
        // failure used to abort the request while leaving the rows it had already
        // archived committed — a half-applied bulk action with no report.
        foreach ($rows as $row) {
            try {
                if ($this->deleteAction->execute($row)) {
                    $deleted++;
                }
            } catch (Throwable $e) {
                $skipped[] = ['id' => $row->id, 'code' => (string) $row->code, 'reason' => $e->getMessage()];
            }
        }

        return ['deleted' => $deleted, 'skipped' => $skipped];
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
