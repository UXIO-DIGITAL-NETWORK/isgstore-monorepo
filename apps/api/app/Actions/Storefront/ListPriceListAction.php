<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\DTOs\Storefront\ListPriceListDTO;
use App\Models\MembershipPlan;
use App\Models\Product;
use App\Support\Membership\DefaultPlan;
use App\Support\Pricing\PlanPrice;
use App\Support\Storefront\Catalog;
use App\Support\Storefront\MediaUrl;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * The public "Daftar Harga" table.
 *
 * Emits one column per active membership plan, in the admin's own order, so the
 * table grows with the plans instead of being pinned to a fixed
 * normal/member/gold triple — the old shape called `price_vip` "gold_price",
 * which was already the wrong plan's price.
 *
 * **The highest tier's price is withheld.** It is the reason to subscribe, and
 * publishing it gives away the whole incentive; the row still appears so the
 * ladder is visible, with `price` null and `is_hidden` true.
 *
 * Retail only. `price_modal` is cost data and must never appear here.
 */
class ListPriceListAction
{
    public function execute(ListPriceListDTO $dto): LengthAwarePaginator
    {
        $query = Catalog::sellableProducts(Product::query())
            ->whereHas('category', fn (Builder $q) => $q->where('status', true))
            ->with(['category:id,name,slug,code,region,logo']);

        if ($dto->game) {
            // Resolved through the same slug/code/id lookup the game routes use,
            // so the price list and the checkout page agree on what a game is.
            $game = Catalog::resolveGame($dto->game);

            // An unknown slug returns nothing rather than silently listing every
            // product, which would look like the filter had been ignored.
            $query->where('category_id', $game?->id ?? 0);
        }

        if ($dto->search) {
            $term = '%'.str_replace('%', '\%', $dto->search).'%';
            $query->where(fn (Builder $q) => $q
                ->where('name', 'like', $term)
                ->orWhereHas('category', fn (Builder $c) => $c->where('name', 'like', $term))
            );
        }

        match ($dto->sort) {
            'name-asc' => $query->orderBy('name'),
            'price-asc' => $query->orderBy('price_member'),
            'price-desc' => $query->orderByDesc('price_member'),
            default => $query->orderBy('id'),
        };

        $plans = MembershipPlan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'code', 'name', 'sort_order', 'is_default']);

        // The last plan in the admin's own ordering is the top tier.
        $hiddenPlanId = $plans->count() > 1 ? (int) $plans->last()->id : null;
        $defaultPlanId = (int) ($plans->firstWhere('is_default', true)?->id ?? DefaultPlan::id());

        return $query
            ->with(['planPrices'])
            ->paginate($dto->perPage)
            ->through(fn (Product $product) => [
                'id' => $product->id,
                'service_name' => $product->name,
                'code' => $product->code,
                'game_id' => $product->category_id,
                'game_name' => $product->category?->name,
                'game_slug' => $product->category?->slug ?: $product->category?->code,
                'game_region' => $product->category?->region,
                'game_logo_url' => MediaUrl::for($product->category?->logo),
                // The default tier, i.e. what a visitor pays today.
                'normal_price' => PlanPrice::for($product, null),
                'tiers' => $plans->map(fn (MembershipPlan $plan) => [
                    'membership_plan_id' => (int) $plan->id,
                    'plan_code' => $plan->code,
                    'plan_name' => $plan->localizedName(app()->getLocale()),
                    'is_default' => (int) $plan->id === $defaultPlanId,
                    'is_hidden' => (int) $plan->id === $hiddenPlanId,
                    'price' => (int) $plan->id === $hiddenPlanId
                        ? null
                        : (int) ($product->planPrices->firstWhere('membership_plan_id', $plan->id)?->price
                            ?? $product->price_member),
                ])->values(),
                'status' => $product->status ? 'active' : 'inactive',
            ]);
    }
}
