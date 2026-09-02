<?php

declare(strict_types=1);

namespace App\Actions\Pricing;

use App\Console\Commands\VerifyPlanPrices;
use App\Models\Product;
use App\Models\ProductPlanPrice;
use App\Support\Membership\DefaultPlan;
use Illuminate\Support\Facades\DB;

/**
 * The only writer of `product_plan_prices` — and therefore the only thing that
 * keeps `products.price_member` honest.
 *
 * `price_member` is a denormalised copy of the default plan's price. Six
 * queries sort and filter on it, and turning those into joins would cost an
 * index for no gain on the pages that carry real traffic. The price of that
 * choice is one invariant: the column must always equal this table's
 * default-plan row. Two writers would let them drift, so there is one, and
 * `pricing:verify` proves it held.
 *
 * A row marked `is_manual` is left alone: an admin typed that price and the
 * scheduled repricer must not silently undo them.
 *
 * @see VerifyPlanPrices
 */
class WritePlanPricesAction
{
    /**
     * @param  array<int,int>  $planPrices  Keyed by membership plan id.
     */
    public function execute(Product $product, array $planPrices, bool $overwriteManual = false): void
    {
        if ($planPrices === []) {
            return;
        }

        $defaultPlanId = DefaultPlan::id();

        DB::transaction(function () use ($product, $planPrices, $overwriteManual, $defaultPlanId) {
            foreach ($planPrices as $planId => $price) {
                $existing = ProductPlanPrice::query()
                    ->where('product_id', $product->getKey())
                    ->where('membership_plan_id', $planId)
                    ->lockForUpdate()
                    ->first();

                if ($existing && $existing->is_manual && ! $overwriteManual) {
                    continue;
                }

                if ($existing) {
                    $existing->update(['price' => (int) $price]);

                    continue;
                }

                ProductPlanPrice::create([
                    'product_id' => $product->getKey(),
                    'membership_plan_id' => $planId,
                    'price' => (int) $price,
                ]);
            }

            // Keep the denormalised copy in step, in the same transaction as
            // the row it mirrors. Read back rather than reusing $planPrices so
            // a skipped manual row is reflected, not overwritten.
            if ($defaultPlanId !== null) {
                $basePrice = ProductPlanPrice::query()
                    ->where('product_id', $product->getKey())
                    ->where('membership_plan_id', $defaultPlanId)
                    ->value('price');

                if ($basePrice !== null && (int) $basePrice !== (int) $product->price_member) {
                    $product->forceFill(['price_member' => (int) $basePrice])->save();
                }
            }
        });
    }
}
