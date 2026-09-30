<?php

namespace App\Actions\Uxiolabs;

use App\Contracts\SupplierGateway;
use App\Models\Product;
use App\Models\SupplierProduct;
use App\Services\PricingService;
use App\Support\Uxiolabs\UxiolabsSupplier;

/**
 * Preview a uxiolabs service before the admin creates a product from it.
 * Reads the shared 5-minute price-list cache (kept warm by the checker).
 */
class LookupUxiolabsSkuAction
{
    public function __construct(
        private readonly SupplierGateway $uxiolabsService,
        private readonly PricingService $pricingService
    ) {}

    /**
     * @return array<string,mixed>|null null when the service id is not in the uxiolabs price list
     */
    public function execute(string $sku, ?int $categoryId = null): ?array
    {
        $item = $this->uxiolabsService->findServiceInPriceList($sku);

        if ($item === null) {
            return null;
        }

        $cost = $this->uxiolabsService->costFor($item);

        $supplier = UxiolabsSupplier::model();
        $alreadyMapped = $supplier
            ? SupplierProduct::where('supplier_id', $supplier->id)->where('buyer_sku_code', $sku)->exists()
            : false;

        // withTrashed so the preview warns about an archived product too —
        // otherwise it reads "not yet added" for a SKU that cannot be added.
        $existingProduct = Product::withTrashed()->where('code', $sku)->first(['id', 'name', 'code']);

        return [
            'buyer_sku_code' => $sku,
            'name' => (string) ($item['nama_layanan'] ?? ''),
            'category' => (string) ($item['kategori'] ?? ''),
            'cost' => $cost,
            'available' => $this->uxiolabsService->isItemActive($item),
            'already_mapped' => $alreadyMapped,
            'existing_product' => $existingProduct,
            'suggested_prices' => $this->pricingService->computePrices($cost, $categoryId),
        ];
    }
}
