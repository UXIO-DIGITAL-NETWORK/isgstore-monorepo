<?php

namespace App\Actions\Product;

use App\Exceptions\SupplierProductPoolException;
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
        private PromoteSupplierProductAction $promoteAction,
        private PublishSupplierProductAction $publishAction,
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
    public function setMargin(
        array $ids,
        array $margins,
        ?int $priceMin = null,
        ?int $priceMax = null,
        bool $limitsProvided = false,
    ): array {
        $rows = SupplierProduct::whereIn('id', $ids)->get();
        foreach ($rows as $row) {
            $this->marginAction->execute($row, $margins, $priceMin, $priceMax, $limitsProvided);
        }

        return ['updated' => $rows->count()];
    }

    /**
     * Promote a selection into draft products.
     *
     * Per-row try/catch so one unpriced SKU cannot abort the batch — the caller
     * reports what was skipped and why, the same contract as delete() above.
     *
     * @param  int[]  $ids
     * @return array{promoted:int, skipped:array<int,array{id:int,buyer_sku_code:string,reason:string}>}
     */
    public function promote(array $ids, ?int $categoryId = null, ?int $subCategoryId = null): array
    {
        $rows = SupplierProduct::whereIn('id', $ids)->get();
        $promoted = 0;
        $skipped = [];

        foreach ($rows as $row) {
            try {
                $this->promoteAction->execute($row, $categoryId, $subCategoryId);
                $promoted++;
            } catch (SupplierProductPoolException $e) {
                $skipped[] = [
                    'id' => $row->id,
                    'buyer_sku_code' => $row->buyer_sku_code,
                    'reason' => $e->getMessage(),
                ];
            }
        }

        return ['promoted' => $promoted, 'skipped' => $skipped];
    }

    /**
     * @param  int[]  $ids
     * @return array{published:int, skipped:array<int,array{id:int,buyer_sku_code:string,reason:string}>}
     */
    public function publish(array $ids): array
    {
        $rows = SupplierProduct::with('product')->whereIn('id', $ids)->get();
        $published = 0;
        $skipped = [];

        foreach ($rows as $row) {
            try {
                $this->publishAction->execute($row);
                $published++;
            } catch (SupplierProductPoolException $e) {
                $skipped[] = [
                    'id' => $row->id,
                    'buyer_sku_code' => $row->buyer_sku_code,
                    'reason' => $e->getMessage(),
                ];
            }
        }

        return ['published' => $published, 'skipped' => $skipped];
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
