<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Pricing\WriteProductPricesAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

/**
 * Per-product price controls used by the Main Products row and bulk actions:
 * hide the price (Show Price), set min/max limits, and re-pull selling prices
 * from the supplier cost (Uxiolabs Update).
 *
 * There was a fourth — a price lock that froze a product's selling price against
 * the supplier sync. It is gone: a frozen price is what leaves a product selling
 * below cost, and checkout then refuses the customer with "harga modal supplier
 * sedang naik". The margin rules decide the price, always.
 *
 * Every path that moves a price goes through `WriteProductPricesAction`, because
 * the plan rows are what customers are billed from and the legacy columns are
 * only a copy of one of them. Writing `price_member` alone — which this class
 * used to do — left the two disagreeing, and the storefront charged the old
 * price while the admin list showed the new one.
 */
class ProductPriceControlAction
{
    public function __construct(
        private WriteProductPricesAction $writePrices,
        private CreateActivityLogAction $activityLogAction,
    ) {}

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

        // The window binds what is charged, not just the copy: clamp each plan's
        // row as well and write them back, which re-syncs `price_member` from the
        // default one. `overwriteManual` because the admin is setting the window
        // right now, and a stored price outside it is what they are correcting.
        $planPrices = $product->planPrices()
            ->pluck('price', 'membership_plan_id')
            ->map(fn ($price) => $this->clamp((int) $price, $min, $max))
            ->all();

        if ($planPrices !== []) {
            $this->writePrices->forPlans($product, $planPrices, overwriteManual: true);
        }

        $this->log($product, 'Set price limits');

        return $product->fresh();
    }

    /**
     * Recompute selling prices from the active supplier mapping's cost, honouring
     * its margin overrides and this product's limits.
     */
    public function uxiolabsUpdate(Product $product): Product
    {
        $mapping = $product->supplierProducts()->where('is_active', true)->first()
            ?? $product->supplierProducts()->first();

        if (! $mapping) {
            return $product;
        }

        $this->writePrices->fromCost($product, (int) $mapping->price, $mapping);
        $this->log($product, 'Uxiotopup price update');

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
