<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Archives a Main Product and returns its provider SKUs to the pool.
 *
 * Archiving, not destroying: `transactions.product_id` is NOT NULL and RESTRICT,
 * so a product that has ever been ordered could not be deleted at all — the
 * DELETE threw a QueryException nothing caught, surfacing as a 500 and leaving
 * the row permanently undeletable. Nothing is removed now, so the constraint is
 * never tested and every invoice, receipt and report keeps resolving.
 */
class DeleteProductAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Product $product): bool
    {
        $name = $product->name;

        return DB::transaction(function () use ($product, $name) {
            // Price change logs are an append-only audit trail — they point at the
            // mapping (which survives the archive) and are deliberately left intact
            // as the record of what happened while the product was live.

            // Return the provider SKUs to the pool rather than losing them.
            //
            // Margins and `margin_set_at` are left intact, so the SKU lands back
            // in the pool as READY and can be re-promoted without re-pricing.
            //
            // The FK is nullOnDelete, but an archive is an UPDATE — it would not
            // fire at all — and it could never clear `is_active` anyway, which
            // would leave an active mapping with no product behind it.
            //
            // `pool_category_id` is carried over so the demoted SKU still knows
            // which category it belongs to and can be re-promoted without
            // re-mapping.
            $product->supplierProducts()->update([
                'product_id' => null,
                'is_active' => false,
                'pool_category_id' => $product->category_id,
            ]);

            $deleted = $product->delete();

            if ($deleted) {
                $this->activityLogAction->execute(new CreateActivityLogDTO(
                    userId: Auth::id(),
                    ipAddress: request()->ip(),
                    userAgent: request()->userAgent(),
                    message: "Archived Product: {$name}"
                ));
            }

            return (bool) $deleted;
        });
    }
}
