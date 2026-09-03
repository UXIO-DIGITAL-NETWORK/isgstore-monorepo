<?php

declare(strict_types=1);

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Pricing\WritePlanPricesAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Product;
use App\Services\PricingService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Re-prices a product from the Main Products form.
 *
 * A product's margins are authored on its provider mapping — that is where
 * `ProductRepricer` reads them, so the scheduled price checker keeps honouring
 * them when the supplier's cost moves. Editing a margin here therefore
 * **delegates to `SetSupplierProductMarginAction`** rather than writing a second
 * path to the same numbers: one implementation means the product screen and the
 * Set Profit Margin screen can never disagree.
 *
 * A product with no mapping at all (created by hand, never pooled) has no such
 * home for its margins, so its prices are computed here from `price_modal` and
 * written directly. That branch cannot follow a cost it does not have.
 */
class SetProductMarginAction
{
    public function __construct(
        private readonly SetSupplierProductMarginAction $mappingMargin,
        private readonly PricingService $pricing,
        private readonly WritePlanPricesAction $writePlanPrices,
        private readonly CreateActivityLogAction $activityLogAction,
    ) {}

    /**
     * @param  array<int,float|null>  $margins  Keyed by membership plan id.
     */
    public function execute(
        Product $product,
        array $margins,
        ?int $priceMin = null,
        ?int $priceMax = null,
        bool $limitsProvided = false,
        ?float $pointPercent = null,
        ?int $pointFlat = null,
        bool $pointsProvided = false,
    ): Product {
        // The active mapping is the one the checker reprices from; an inactive
        // one is still a better home for the margins than nowhere.
        $mapping = $product->supplierProducts()
            ->orderByDesc('is_active')
            ->orderBy('id')
            ->first();

        if ($mapping) {
            $this->mappingMargin->execute(
                $mapping,
                $margins,
                $priceMin,
                $priceMax,
                $limitsProvided,
                $pointPercent,
                $pointFlat,
                $pointsProvided,
            );

            return $product->fresh(['category', 'subCategory', 'supplierProducts', 'planPrices.membershipPlan']);
        }

        $this->priceWithoutMapping($product, $margins, $priceMin, $priceMax, $limitsProvided, $pointPercent, $pointFlat, $pointsProvided);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Set profit margin for product: {$product->code}",
        ));

        return $product->fresh(['category', 'subCategory', 'supplierProducts', 'planPrices.membershipPlan']);
    }

    /**
     * @param  array<int,float|null>  $margins
     */
    private function priceWithoutMapping(
        Product $product,
        array $margins,
        ?int $priceMin,
        ?int $priceMax,
        bool $limitsProvided,
        ?float $pointPercent,
        ?int $pointFlat,
        bool $pointsProvided,
    ): void {
        DB::transaction(function () use ($product, $margins, $priceMin, $priceMax, $limitsProvided, $pointPercent, $pointFlat, $pointsProvided) {
            $attributes = [];

            if ($limitsProvided) {
                $attributes['price_min'] = $priceMin;
                $attributes['price_max'] = $priceMax;
            }

            if ($pointsProvided) {
                $attributes['point_percent'] = $pointPercent;
                $attributes['point_flat'] = $pointFlat;
            }

            if ($attributes !== []) {
                $product->update($attributes);
                $product->refresh();
            }

            // `overwriteManual`: the admin is typing these prices right now, so
            // a row they typed earlier is exactly what they mean to replace.
            $this->writePlanPrices->execute(
                $product,
                $this->pricing->computePlanPrices(
                    (int) $product->price_modal,
                    $product->category_id,
                    array_filter($margins, fn ($margin) => $margin !== null),
                    $product->price_min,
                    $product->price_max,
                ),
                overwriteManual: true,
            );
        });
    }
}
