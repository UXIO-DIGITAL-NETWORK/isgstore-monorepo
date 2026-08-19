<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\SupplierProduct;
use App\Services\PricingService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Stores per-tier profit-margin overrides on a provider mapping and recomputes
 * the linked product's selling prices from its cost, honouring the product's
 * price limits. A null margin for a tier falls back to the pricing rules.
 */
class SetSupplierProductMarginAction
{
    public function __construct(
        private PricingService $pricing,
        private CreateActivityLogAction $activityLogAction,
    ) {}

    /**
     * @param  array{member:?float,vip:?float,reseller:?float,agent:?float}  $margins
     */
    public function execute(SupplierProduct $supplierProduct, array $margins): SupplierProduct
    {
        return DB::transaction(function () use ($supplierProduct, $margins) {
            $supplierProduct->update([
                'margin_member' => $margins['member'] ?? null,
                'margin_vip' => $margins['vip'] ?? null,
                'margin_reseller' => $margins['reseller'] ?? null,
                'margin_agent' => $margins['agent'] ?? null,
            ]);

            $product = $supplierProduct->product;
            if ($product) {
                $prices = $this->pricing->computePrices(
                    (int) $supplierProduct->price,
                    $product->category_id,
                    array_filter($margins, fn ($m) => $m !== null),
                    $product->price_min,
                    $product->price_max,
                );
                $product->update($prices);
            }

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Set profit margin for provider SKU: {$supplierProduct->buyer_sku_code}"
            ));

            return $supplierProduct->fresh(['product', 'supplier']);
        });
    }
}
