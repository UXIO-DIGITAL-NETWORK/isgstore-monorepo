<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\SupplierProduct;
use Illuminate\Support\Facades\Auth;

/**
 * Toggles the price lock on a provider mapping. A locked mapping is skipped by
 * the uxiotopup price sync, so an admin-set price is never overwritten.
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
