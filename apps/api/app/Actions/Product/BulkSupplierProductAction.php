<?php

namespace App\Actions\Product;

use App\Models\SupplierProduct;

/**
 * Applies a provider action across a selection, reusing the single-row actions
 * so logging and price recomputation stay identical. Delete skips System rows
 * (the Internal System supplier is protected) and reports them as skipped.
 */
class BulkSupplierProductAction
{
    public function __construct(
        private LockSupplierProductPriceAction $lockAction,
        private SetSupplierProductMarginAction $marginAction,
        private DeleteSupplierProductAction $deleteAction,
    ) {}

    /**
     * @param  int[]  $ids
     * @return array{updated:int}
     */
    public function lockPrice(array $ids, bool $locked): array
    {
        $rows = SupplierProduct::whereIn('id', $ids)->get();
        foreach ($rows as $row) {
            $this->lockAction->execute($row, $locked);
        }

        return ['updated' => $rows->count()];
    }

    /**
     * @param  int[]  $ids
     * @param  array{member:?float,vip:?float,reseller:?float,agent:?float}  $margins
     * @return array{updated:int}
     */
    public function setMargin(array $ids, array $margins): array
    {
        $rows = SupplierProduct::whereIn('id', $ids)->get();
        foreach ($rows as $row) {
            $this->marginAction->execute($row, $margins);
        }

        return ['updated' => $rows->count()];
    }

    /**
     * @param  int[]  $ids
     * @return array{deleted:int, skipped:array<int,array{id:int,reason:string}>}
     */
    public function delete(array $ids): array
    {
        $rows = SupplierProduct::with('supplier')->whereIn('id', $ids)->get();
        $deleted = 0;
        $skipped = [];

        foreach ($rows as $row) {
            if ($row->supplier?->is_system) {
                $skipped[] = ['id' => $row->id, 'reason' => 'System provider products cannot be deleted.'];

                continue;
            }
            $this->deleteAction->execute($row);
            $deleted++;
        }

        return ['deleted' => $deleted, 'skipped' => $skipped];
    }
}
