<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\FlashSale;
use App\Models\FlashSaleItem;
use App\Models\Product;
use App\Models\Promo;
use App\Models\User;
use App\Support\Pricing\PlanPrice;
use App\Support\Promo\PromoResolver;
use App\Support\Storefront\MediaUrl;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public marketing surface: the running flash sale and the promo codes the
 * storefront is allowed to advertise.
 */
class MarketingController extends Controller
{
    use ApiResponse;

    public function flashSale(): JsonResponse
    {
        $sale = FlashSale::running()
            ->with(['items.product.category'])
            ->orderBy('ends_at')
            ->first();

        if (! $sale) {
            // A missing sale is not an error — the homepage block simply
            // renders nothing. A 404 would make the whole page look broken.
            return $this->successResponse(null, 'No flash sale is running');
        }

        $items = $sale->items
            ->sortBy('sort_order')
            ->map(function (FlashSaleItem $item) {
                $product = $item->product;

                return [
                    'id' => $item->id,
                    'product_id' => $product?->id,
                    'name' => $product?->name,
                    'game' => $product?->category?->name,
                    // The card links to the game's checkout, and that route takes
                    // a slug. Without this the storefront had nothing to build the
                    // link from and used the item's own id, which resolved to a
                    // game that does not exist.
                    'game_slug' => $product?->category?->slug,
                    'image_url' => MediaUrl::for($product?->logo ?: $product?->category?->thumbnail),
                    'sale_price' => (int) $item->sale_price,
                    // Derived from the product's live price, never stored: a
                    // frozen copy would advertise a discount off a price that
                    // no longer exists.
                    'original_price' => (int) ($product?->price_member ?? 0),
                    'discount' => $this->discountPercent(
                        (int) ($product?->price_member ?? 0),
                        (int) $item->sale_price
                    ),
                    'stock_available' => $item->stockAvailable(),
                    'stock_total' => (int) $item->stock_total,
                ];
            })
            ->filter(fn (array $item) => $item['product_id'] !== null)
            ->values();

        return $this->successResponse([
            'id' => $sale->id,
            'name' => $sale->name,
            'starts_at' => $sale->starts_at,
            // The storefront's countdown reads this instead of a hardcoded
            // duration, so the timer matches when the sale actually ends.
            'ends_at' => $sale->ends_at,
            'items' => $items,
        ], 'Flash sale retrieved successfully');
    }

    public function promos(): JsonResponse
    {
        $promos = Promo::running()
            ->where('is_public', true)
            ->orderByDesc('value')
            ->get()
            ->map(fn (Promo $promo) => [
                'id' => $promo->id,
                'code' => $promo->code,
                'name' => $promo->name,
                'description' => $promo->description,
                'type' => $promo->type,
                'value' => (int) $promo->value,
                'max_discount' => $promo->max_discount !== null ? (int) $promo->max_discount : null,
                'min_purchase' => (int) $promo->min_purchase,
                'ends_at' => $promo->ends_at,
            ])
            ->values();

        return $this->successResponse($promos, 'Promos retrieved successfully');
    }

    /**
     * Validates a code against a specific product and amount.
     *
     * Always answers 200 with a `valid` flag rather than a 4xx: an invalid
     * coupon is a normal outcome of the customer typing one, not a request
     * error, and the checkout form needs the reason to show inline.
     */
    /**
     * Validates a code against a specific product and amount.
     *
     * Always answers 200 with a `valid` flag rather than a 4xx: an invalid
     * coupon is a normal outcome of the customer typing one, not a request
     * error, and the checkout form needs the reason to show inline.
     *
     * The arithmetic lives in PromoResolver, which checkout also uses — so the
     * figure quoted here is by construction the figure charged.
     */
    public function validatePromo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:64'],
            'product_id' => ['nullable', 'exists:products,id'],
            'amount' => ['nullable', 'integer', 'min:0'],
        ]);

        $amount = $validated['amount'] ?? $this->productPrice($validated['product_id'] ?? null, $request->user('sanctum'));

        $result = PromoResolver::resolve($validated['code'], $amount, $request->user('sanctum'), $this->productFor($validated['product_id'] ?? null));

        return $this->successResponse([
            'valid' => $result->valid,
            'code' => $result->promo?->code,
            'name' => $result->promo?->name,
            'discount_amount' => $result->discount,
        ], $result->message);
    }

    /**
     * The price the customer will actually be charged, through the same
     * resolver checkout uses — so a code quoted against a flash-sale price is
     * quoted against the price on the invoice.
     */
    private function productPrice(?int $productId, ?User $user): int
    {
        $product = $this->productFor($productId);

        return $product ? PlanPrice::for($product, $user) : 0;
    }

    private function productFor(?int $productId): ?Product
    {
        return $productId ? Product::find($productId) : null;
    }

    private function discountPercent(int $original, int $sale): int
    {
        if ($original <= 0 || $sale >= $original) {
            return 0;
        }

        return (int) round((($original - $sale) / $original) * 100);
    }
}
