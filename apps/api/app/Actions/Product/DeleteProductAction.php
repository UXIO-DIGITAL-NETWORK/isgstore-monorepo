<?php

namespace App\Actions\Product;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeleteProductAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Product $product): bool
    {
        $name = $product->name;

        return DB::transaction(function () use ($product, $name) {
            // Return the provider SKUs to the pool rather than losing them.
            //
            // The FK is nullOnDelete, so `product_id` would clear itself — but it
            // cannot clear `is_active`, which would leave an active mapping with no
            // product behind it. Doing it explicitly also keeps the behaviour identical
            // on SQLite, where the FK swap is not applied.
            //
            // `pool_category_id` is carried over so the demoted SKU still knows which
            // category it belongs to and can be re-promoted without re-mapping.
            $product->supplierProducts()->update([
                'product_id' => null,
                'is_active' => false,
                'pool_category_id' => $product->category_id,
            ]);

            $deleted = $product->delete();

            if ($deleted) {
                $this->activityLogAction->execute(new CreateActivityLogDTO(
                    userId: Auth::id(),
                    ipAddress: request()->ip(),
                    userAgent: request()->userAgent(),
                    message: "Deleted Product: {$name}"
                ));
            }

            return $deleted;
        });
    }
}
