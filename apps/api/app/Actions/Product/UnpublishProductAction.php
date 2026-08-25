<?php

declare(strict_types=1);

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Takes a product off the storefront — the exact reverse of PublishProductAction.
 *
 * Both halves of "sellable" go off together. Turning off `products.status` alone
 * would leave a live mapping behind, and turning it back on would make the
 * product sellable again by accident rather than by decision.
 *
 * `published_at` is deliberately NOT cleared: it is what separates a product
 * that has never been live (draft) from one that was taken down (unpublished),
 * and rewriting it would lose the date it first went on sale.
 */
class UnpublishProductAction
{
    public function __construct(private readonly CreateActivityLogAction $activityLogAction) {}

    public function execute(Product $product): Product
    {
        return DB::transaction(function () use ($product) {
            $product->update(['status' => false]);

            // `sync_deactivated_at` is provenance, not a timestamp: the 5-minute
            // price checker only re-activates mappings IT turned off. Leaving a
            // stamp here would let the next run silently put this product back on
            // sale — clearing it marks the decision as a human's, permanently.
            $product->supplierProducts()->update([
                'is_active' => false,
                'sync_deactivated_at' => null,
            ]);

            $this->activityLogAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Unpublished product {$product->code}",
            ));

            return $product->fresh(['supplierProducts']);
        });
    }
}
