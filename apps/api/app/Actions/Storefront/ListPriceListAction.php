<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\DTOs\Storefront\ListPriceListDTO;
use App\Models\Product;
use App\Support\Storefront\Catalog;
use App\Support\Storefront\MediaUrl;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * The public "Daftar Harga" table.
 *
 * Exposes the retail ladder (member / vip) only. `price_modal` is cost data and
 * must never appear here.
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

        return $query
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
                'normal_price' => (int) $product->price_member,
                'member_price' => (int) $product->price_member,
                'gold_price' => (int) $product->price_vip,
                'status' => $product->status ? 'active' : 'inactive',
            ]);
    }
}
