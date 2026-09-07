<?php

namespace App\Services;

use App\Models\MembershipPlan;
use App\Models\Product;
use App\Models\SupplierProduct;
use App\Support\Membership\DefaultPlan;

/**
 * The single wiring of "a mapping's cost + its authored margins + the product's
 * limits → selling prices". Both the scheduled checker (CheckUxiolabsPricesAction)
 * and the manual "Uxiolabs Update" (ProductPriceControlAction) run through this,
 * so the two can never drift on how a price is derived.
 *
 * Margins are authored per membership plan (`supplier_product_margins`). The
 * four legacy `supplier_products.margin_*` columns are still read as a fallback
 * for mappings nobody has re-authored since the cutover, and are dropped once a
 * release has been green in production.
 *
 * Pure: it computes, it does not persist and it does not consult the price lock —
 * callers decide whether to write and whether the lock forbids it.
 */
class ProductRepricer
{
    public function __construct(private readonly PricingService $pricing) {}

    /**
     * The legacy five-column shape, for the callers that still write them.
     *
     * @return array{price_modal:int, price_member:int, price_vip:int, price_reseller:int, price_agent:int}
     */
    public function compute(int $cost, Product $product, SupplierProduct $mapping): array
    {
        return $this->pricing->computePrices(
            $cost,
            $product->category_id,
            $this->legacyMargins($mapping),
            $product->price_min,
            $product->price_max,
        );
    }

    /**
     * One price per membership plan — what `product_plan_prices` stores.
     *
     * @return array<int,int> Keyed by membership plan id.
     */
    public function computeForPlans(int $cost, Product $product, SupplierProduct $mapping): array
    {
        return $this->pricing->computePlanPrices(
            $cost,
            $product->category_id,
            $this->planMargins($mapping),
            $product->price_min,
            $product->price_max,
        );
    }

    /**
     * The authored margin per plan, newest source first.
     *
     * @return array<int,float> Keyed by membership plan id.
     */
    public function planMargins(SupplierProduct $mapping): array
    {
        $margins = $mapping->planMargins()
            ->pluck('margin_percent', 'membership_plan_id')
            ->map(fn ($margin) => (float) $margin)
            ->all();

        if ($margins !== []) {
            return $margins;
        }

        // Not re-authored since the cutover: read the frozen columns through the
        // same role→plan map the rest of the bridge uses.
        foreach (self::planIdByRole() as $role => $planId) {
            $legacy = $mapping->{'margin_'.$role} ?? null;

            if ($legacy !== null) {
                $margins[$planId] = (float) $legacy;
            }
        }

        return $margins;
    }

    /** @return array<string,float> Role-keyed, for the legacy column bridge. */
    private function legacyMargins(SupplierProduct $mapping): array
    {
        $planMargins = $this->planMargins($mapping);
        $roleByPlan = array_flip(self::planIdByRole());

        $margins = [];

        foreach ($planMargins as $planId => $margin) {
            $role = $roleByPlan[$planId] ?? null;

            if ($role !== null) {
                $margins[$role] = $margin;
            }
        }

        return $margins;
    }

    /**
     * Lowercased role name → the plan that grants it, with `member` mapped to
     * the default plan (no plan ever granted it; it was the free tier).
     *
     * @return array<string,int>
     */
    public static function planIdByRole(): array
    {
        $map = MembershipPlan::query()
            ->whereNotNull('membership_plans.role_id')
            ->join('roles', 'roles.id', '=', 'membership_plans.role_id')
            ->orderBy('membership_plans.id')
            ->pluck('membership_plans.id', 'roles.name')
            ->mapWithKeys(fn ($planId, $name) => [strtolower((string) $name) => (int) $planId])
            ->all();

        $defaultPlanId = DefaultPlan::id();

        if ($defaultPlanId !== null && ! isset($map['member'])) {
            $map['member'] = $defaultPlanId;
        }

        return $map;
    }
}
