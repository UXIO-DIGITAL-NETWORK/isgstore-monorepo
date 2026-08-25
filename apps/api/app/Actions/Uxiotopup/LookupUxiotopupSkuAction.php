<?php

namespace App\Actions\Uxiotopup;

use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Services\PricingService;
use App\Services\UxiotopupService;

/**
 * Preview a uxiotopup service before the admin creates a product from it.
 * Reads the shared 5-minute price-list cache (kept warm by the checker).
 */
class LookupUxiotopupSkuAction
{
    public function __construct(
        private readonly UxiotopupService $uxiotopupService,
        private readonly PricingService $pricingService
    ) {}

    /**
     * @return array<string,mixed>|null null when the service id is not in the uxiotopup price list
     */
    public function execute(string $sku, ?int $categoryId = null): ?array
    {
        $item = $this->uxiotopupService->findServiceInPriceList($sku);

        if ($item === null) {
            return null;
        }

        $cost = $this->uxiotopupService->costFor($item);

        $supplier = Supplier::where('name', 'Uxiotopup')->first();
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
            'available' => UxiotopupService::isItemActive($item),
            'already_mapped' => $alreadyMapped,
            'existing_product' => $existingProduct,
            'suggested_prices' => $this->pricingService->computePrices($cost, $categoryId),
        ];
    }
}
