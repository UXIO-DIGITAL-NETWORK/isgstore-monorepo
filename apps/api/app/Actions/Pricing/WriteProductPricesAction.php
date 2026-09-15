<?php

declare(strict_types=1);

namespace App\Actions\Pricing;

use App\Models\Product;
use App\Models\SupplierProduct;
use App\Services\ProductRepricer;
use App\Support\Membership\DefaultPlan;

/**
 * The one way a product's selling prices are written.
 *
 * Two tables describe them: `product_plan_prices`, which is what `PlanPrice`
 * quotes and bills, and the legacy `products.price_*` columns, which six
 * sort/filter queries and the price change log read. `price_member` mirrors the
 * default plan's row, and that mirror is the invariant `pricing:verify` guards.
 *
 * A writer that touches one table and not the other drifts them apart, and the
 * drift is silent — the storefront keeps billing the plan row while the admin
 * list and the change log show the column. That is exactly what happened: the
 * scheduled price checker repriced `price_member` whenever a cost moved and
 * never touched the table customers are charged from, so "Harga jual diperbarui
 * otomatis" was logged for a price nobody was ever charged.
 *
 * @see WritePlanPricesAction the single writer of the plan rows themselves
 */
final class WriteProductPricesAction
{
    public function __construct(
        private readonly WritePlanPricesAction $writePlanPrices,
        private readonly ProductRepricer $repricer,
    ) {}

    /**
     * Write the prices a mapping's cost and authored margins imply.
     *
     * Returns the legacy column shape, because the caller that has to record
     * them — the price change log stores each tier — should not have to ask the
     * repricer for answers this call already has.
     *
     * @return array{price_modal:int, price_member:int, price_vip:int, price_reseller:int, price_agent:int}
     */
    public function fromCost(Product $product, int $cost, SupplierProduct $mapping, bool $overwriteManual = false): array
    {
        $legacy = $this->repricer->compute($cost, $product, $mapping);

        $this->forPlans($product, $this->repricer->computeForPlans($cost, $product, $mapping), $overwriteManual);

        // The frozen columns are written *after* the plan rows, and without
        // `price_member`: that column now belongs to WritePlanPricesAction, and
        // letting this bridge's own idea of the default tier land on top of it
        // is the drift this action exists to prevent.
        unset($legacy['price_member']);
        $product->update($legacy);

        // Read back rather than reusing the computed figure: a manual row the
        // write deliberately skipped still wins, and the caller has to log what
        // is genuinely charged.
        return [...$legacy, 'price_member' => (int) $product->price_member];
    }

    /**
     * Write explicit prices, keyed by membership plan id.
     *
     * @param  array<int, int>  $planPrices
     */
    public function forPlans(Product $product, array $planPrices, bool $overwriteManual = false): void
    {
        $this->writePlanPrices->execute($product, $planPrices, $overwriteManual);
    }

    /**
     * Write the price an admin typed for the default tier.
     *
     * `price_member` is where that number has always been entered on the product
     * form, and the default plan's row is where it is billed from now, so the two
     * have to be written together. A manual row is overwritten: the admin is
     * typing this price right now, which makes an earlier one the thing they mean
     * to replace.
     */
    public function forDefaultPlan(Product $product, int $price): void
    {
        $defaultPlanId = DefaultPlan::id();

        if ($defaultPlanId !== null) {
            $this->writePlanPrices->execute($product, [$defaultPlanId => $price], overwriteManual: true);
        }
    }
}
