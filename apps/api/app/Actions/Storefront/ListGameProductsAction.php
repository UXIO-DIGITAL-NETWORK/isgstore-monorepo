<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Support\Membership\DefaultPlan;
use App\Support\Membership\MembershipResolver;
use App\Support\Points\PointRules;
use App\Support\Pricing\PlanPrice;
use App\Support\Stock\DailyStockLimit;
use App\Support\Storefront\Catalog;

/**
 * Denominations for one game, priced for whoever is asking.
 *
 * Never exposes price_modal, margin or supplier data — the returned array is
 * built field-by-field rather than by serializing the model.
 */
class ListGameProductsAction
{
    /** @return array{groups: list<string>, products: list<array<string, mixed>>} */
    public function execute(Category $game, ?User $user): array
    {
        $planId = MembershipResolver::planIdFor($user);
        // Read once for the whole ladder rather than per denomination.
        $pointGlobals = PointRules::globalRule();

        $rows = Catalog::productsFor($game)
            ->with([
                'subCategory:id,name',
                // The active mapping carries the day's allowance for this SKU, and
                // eager-loading it is what lets one count cover the whole page.
                'supplierProducts' => fn ($q) => $q->where('is_active', true),
                // Eager-loaded so `PlanPrice` reads the collection instead of
                // querying per row — this is what its relationLoaded guard is
                // for, and without it one listing becomes N queries.
                'planPrices' => fn ($q) => $q->whereIn('membership_plan_id', array_filter([$planId, DefaultPlan::id()])),
            ])
            ->get(['id', 'sub_category_id', 'name', 'code', 'price_member', 'point_percent', 'point_flat']);

        // One extra query for the page, not one per denomination.
        $stock = DailyStockLimit::remainingFor($rows);

        $products = $rows
            ->map(fn (Product $product) => Catalog::denomination(
                $product,
                PlanPrice::for($product, $user),
                $pointGlobals,
                $stock[(int) $product->id] ?? null,
            ))
            // Sorted after pricing, not by `price_member` in SQL. One game is a
            // few dozen denominations, so this is free — and it removes the
            // whole class of bug where the ladder is ordered by the default
            // price while a different plan's prices are on screen.
            ->sortBy('price')
            ->values();

        return [
            // Distinct group labels in display order — the checkout page renders
            // these as its category tabs, so it never has to derive them itself.
            'groups' => $products->pluck('group')->unique()->values()->all(),
            'products' => $products->all(),
        ];
    }
}
