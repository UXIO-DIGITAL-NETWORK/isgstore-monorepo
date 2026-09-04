<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\SupplierProduct;
use Illuminate\Support\Facades\Auth;

/**
 * Toggles the price lock on a provider mapping.
 *
 * The lock guards the *selling* price, not the supplier cost. `ProductPriceControlAction`
 * reads it (via `products.is_price_locked`) and refuses to re-derive a product's four
 * selling prices from a changed cost. `CheckUxiolabsPricesAction` deliberately does NOT
 * read it: the 5-minute sync only ever writes `supplier_products.price`, which is the
 * supplier's own cost — a fact, not a decision. Freezing that would leave a stale cost
 * behind checkout's margin guard and silently sell below cost.
 *
 * (An earlier version of this docblock claimed the sync skips locked mappings. It never
 * did, and it should not.)
 */
class LockSupplierProductPriceAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(SupplierProduct $supplierProduct, bool $locked): SupplierProduct
    {
        $supplierProduct->update(['is_price_locked' => $locked]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: ($locked ? 'Locked' : 'Unlocked')." price for provider SKU: {$supplierProduct->buyer_sku_code}"
        ));

        return $supplierProduct->fresh();
    }
}
