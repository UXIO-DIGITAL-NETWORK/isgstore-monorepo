<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SupplierProduct;

/**
 * The single wiring of "a mapping's cost + its margin overrides + the product's
 * limits → selling prices". Both the scheduled checker (CheckUxiotopupPricesAction)
 * and the manual "Uxiotopup Update" (ProductPriceControlAction) run through this,
 * so the two can never drift on how a price is derived.
 *
 * Pure: it computes, it does not persist and it does not consult the price lock —
 * callers decide whether to write and whether the lock forbids it.
 */
class ProductRepricer
{
    public function __construct(private readonly PricingService $pricing) {}

    /**
     * @return array{price_modal:int, price_member:int, price_vip:int, price_reseller:int, price_agent:int}
     */
    public function compute(int $cost, Product $product, SupplierProduct $mapping): array
    {
        return $this->pricing->computePrices(
            $cost,
            $product->category_id,
            array_filter([
                'member' => $mapping->margin_member,
                'vip' => $mapping->margin_vip,
                'reseller' => $mapping->margin_reseller,
                'agent' => $mapping->margin_agent,
            ], fn ($margin) => $margin !== null),
            $product->price_min,
            $product->price_max,
        );
    }
}
