<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Support\Pricing\RolePrice;
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
        $products = Catalog::productsFor($game)
            ->with('subCategory:id,name')
            // Ordered by the guest price so the ladder reads low→high for
            // everyone; tier prices keep the same relative order.
            ->orderBy('price_member')
            ->get(['id', 'sub_category_id', 'name', 'code', 'price_member', 'price_vip', 'price_reseller', 'price_agent'])
            ->map(fn (Product $product) => Catalog::denomination($product, RolePrice::for($product, $user)))
            ->values();

        return [
            // Distinct group labels in display order — the checkout page renders
            // these as its category tabs, so it never has to derive them itself.
            'groups' => $products->pluck('group')->unique()->values()->all(),
            'products' => $products->all(),
        ];
    }
}
