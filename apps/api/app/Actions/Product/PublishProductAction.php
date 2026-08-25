<?php

declare(strict_types=1);

namespace App\Actions\Product;

use App\Exceptions\SupplierProductPoolException;
use App\Models\Product;

/**
 * Publishes a Main Product — the product-keyed door onto the same act the pool
 * pipeline calls Publish.
 *
 * The Main Products list used to offer "Activate", which wrote `products.status`
 * and nothing else. `Catalog::sellableProducts()` needs a second thing — an
 * active supplier mapping — so Activate produced products the admin was told
 * were live while the storefront could not see them, with no way to tell from
 * that screen. One verb now does both halves from either screen.
 *
 * The work itself stays in PublishSupplierProductAction: that is where
 * MapSupplierProductAction enforces "one active supplier per product", the rule
 * checkout's `supplierProducts->first()` quietly depends on. This resolves which
 * mapping to hand it and nothing more.
 */
class PublishProductAction
{
    public function __construct(private readonly PublishSupplierProductAction $publishMapping) {}

    /**
     * @throws SupplierProductPoolException
     */
    public function execute(Product $product): Product
    {
        $product->loadMissing('supplierProducts');

        if (($reason = $product->publishBlockedReason()) !== null) {
            throw new SupplierProductPoolException($reason);
        }

        return $this->publishMapping->execute($product->publishableMapping());
    }
}
