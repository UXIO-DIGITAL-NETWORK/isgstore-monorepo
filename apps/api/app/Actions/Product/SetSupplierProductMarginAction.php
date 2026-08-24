<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\SupplierProduct;
use App\Services\PricingService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Stores per-tier profit-margin overrides and price limits on a provider mapping.
 *
 * For a promoted mapping it also recomputes the linked product's selling prices
 * from its cost. For a pooled one there is no product yet, so the numbers are
 * simply held until promote reads them — which is the whole point of pricing a
 * SKU before it becomes sellable.
 *
 * A null margin for a tier falls back to the pricing rules. That is a legitimate
 * choice, which is why `margin_set_at` is stamped either way: the promote gate
 * asks "did an admin decide?", not "is there a number?".
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
    public function execute(
        SupplierProduct $supplierProduct,
        array $margins,
        ?int $priceMin = null,
        ?int $priceMax = null,
        bool $limitsProvided = false,
    ): SupplierProduct {
        return DB::transaction(function () use ($supplierProduct, $margins, $priceMin, $priceMax, $limitsProvided) {
            $attributes = [
                'margin_member' => $margins['member'] ?? null,
                'margin_vip' => $margins['vip'] ?? null,
                'margin_reseller' => $margins['reseller'] ?? null,
                'margin_agent' => $margins['agent'] ?? null,
                'margin_set_at' => now(),
            ];

            // Only touch the limits when the caller actually sent them, so saving
            // margins from a form without the limit fields does not silently clear
            // a window someone set earlier.
            if ($limitsProvided) {
                $attributes['price_min'] = $priceMin;
                $attributes['price_max'] = $priceMax;
            }

            $supplierProduct->update($attributes);
            $supplierProduct->refresh();

            $product = $supplierProduct->product;

            if ($product) {
                if ($limitsProvided) {
                    $product->update(['price_min' => $priceMin, 'price_max' => $priceMax]);
                    $product->refresh();
                }

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

            return $supplierProduct->fresh(['product', 'supplier', 'poolCategory']);
        });
    }
}
