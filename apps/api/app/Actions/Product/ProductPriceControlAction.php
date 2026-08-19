<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Product;
use App\Services\PricingService;
use Illuminate\Support\Facades\Auth;

/**
 * Per-product price controls used by the Main Products row and bulk actions:
 * lock (skip the supplier sync), hide the price (Show Price), set min/max limits,
 * and re-pull selling prices from the supplier cost (Digiflazz Update).
 */
class ProductPriceControlAction
{
    public function __construct(
        private PricingService $pricing,
        private CreateActivityLogAction $activityLogAction,
    ) {}

    public function lock(Product $product, bool $locked): Product
    {
        $product->update(['is_price_locked' => $locked]);
        $this->log($product, ($locked ? 'Locked' : 'Unlocked').' price');

        return $product->fresh();
    }

    public function hide(Product $product, bool $hidden): Product
    {
        $product->update(['is_price_hidden' => $hidden]);
        $this->log($product, ($hidden ? 'Hid' : 'Showed').' price');

        return $product->fresh();
    }

    public function setLimit(Product $product, ?int $min, ?int $max): Product
    {
        $product->update([
            'price_min' => $min,
            'price_max' => $max,
            // Re-clamp the stored selling prices to the new window.
            'price_member' => $this->clamp((int) $product->price_member, $min, $max),
            'price_vip' => $this->clamp((int) $product->price_vip, $min, $max),
            'price_reseller' => $this->clamp((int) $product->price_reseller, $min, $max),
            'price_agent' => $this->clamp((int) $product->price_agent, $min, $max),
        ]);
        $this->log($product, 'Set price limits');

        return $product->fresh();
    }

    /**
     * Recompute selling prices from the active supplier mapping's cost, honouring
     * its margin overrides and this product's limits. A locked product is left
     * untouched.
     */
    public function digiflazzUpdate(Product $product): Product
    {
        if ($product->is_price_locked) {
            return $product;
        }

        $mapping = $product->supplierProducts()->where('is_active', true)->first()
            ?? $product->supplierProducts()->first();

        if (! $mapping) {
            return $product;
        }

        $prices = $this->pricing->computePrices(
            (int) $mapping->price,
            $product->category_id,
            array_filter([
                'member' => $mapping->margin_member,
                'vip' => $mapping->margin_vip,
                'reseller' => $mapping->margin_reseller,
                'agent' => $mapping->margin_agent,
            ], fn ($m) => $m !== null),
            $product->price_min,
            $product->price_max,
        );
        $product->update($prices);
        $this->log($product, 'Digiflazz price update');

        return $product->fresh();
    }

    private function clamp(int $price, ?int $min, ?int $max): int
    {
        if ($min !== null && $min > 0 && $price < $min) {
            $price = $min;
        }
        if ($max !== null && $max > 0 && $price > $max) {
            $price = $max;
        }

        return $price;
    }

    private function log(Product $product, string $what): void
    {
        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "{$what} for product: {$product->name}"
        ));
    }
}
