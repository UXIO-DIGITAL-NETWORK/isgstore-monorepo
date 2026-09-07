<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\ProductPlanPrice;
use App\Support\Membership\DefaultPlan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Proves the two things the pricing model assumes but cannot enforce.
 *
 * 1. **Every product is priced.** An empty price table while products exist
 *    means the backfill never ran, which sells to every paying member at the
 *    base tier without erroring. This is the health check that turns that
 *    silence into a failure.
 * 2. **`products.price_member` equals the default plan's row.** That column is
 *    a denormalised copy kept only so six sort/filter queries can stay on an
 *    index; `WritePlanPricesAction` is its single writer, and this is the proof
 *    that no second writer appeared.
 *
 * Exits non-zero on either, so it can gate a deploy.
 */
class VerifyPlanPrices extends Command
{
    protected $signature = 'pricing:verify';

    protected $description = 'Check that every product has plan prices and price_member matches the default plan';

    public function handle(): int
    {
        $defaultPlanId = DefaultPlan::id();

        if ($defaultPlanId === null) {
            $this->error('No default membership plan exists.');

            return self::FAILURE;
        }

        $productCount = Product::count();

        if ($productCount > 0 && ProductPlanPrice::count() === 0) {
            $this->error("product_plan_prices is empty while {$productCount} product(s) exist — run `pricing:backfill-plan-prices`.");

            return self::FAILURE;
        }

        $unpriced = Product::query()
            ->whereDoesntHave('planPrices', fn ($q) => $q->where('membership_plan_id', $defaultPlanId))
            ->count();

        $drifted = DB::table('products')
            ->join('product_plan_prices as ppp', function ($join) use ($defaultPlanId) {
                $join->on('ppp.product_id', '=', 'products.id')
                    ->where('ppp.membership_plan_id', '=', $defaultPlanId);
            })
            ->whereColumn('products.price_member', '!=', 'ppp.price')
            ->count();

        if ($unpriced === 0 && $drifted === 0) {
            $this->info("Plan prices OK: {$productCount} product(s), no drift.");

            return self::SUCCESS;
        }

        if ($unpriced > 0) {
            $this->error("{$unpriced} product(s) have no default-plan price.");
        }

        if ($drifted > 0) {
            $this->error("{$drifted} product(s) have price_member disagreeing with their default-plan price.");
        }

        return self::FAILURE;
    }
}
