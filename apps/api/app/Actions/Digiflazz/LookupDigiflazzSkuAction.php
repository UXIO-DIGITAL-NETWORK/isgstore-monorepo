<?php

namespace App\Actions\Digiflazz;

use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Services\DigiflazzService;
use App\Services\PricingService;

/**
 * Preview a Digiflazz SKU before the admin creates a product from it.
 * Reads the shared 5-minute price-list cache (kept warm by the checker).
 */
class LookupDigiflazzSkuAction
{
    public function __construct(
        private readonly DigiflazzService $digiflazzService,
        private readonly PricingService $pricingService
    ) {}

    /**
     * @return array<string,mixed>|null null when the SKU is not in the Digiflazz price list
     */
    public function execute(string $sku, string $type = 'prepaid', ?int $categoryId = null): ?array
    {
        $item = $this->digiflazzService->findSkuInPriceList($sku, $type);

        if ($item === null) {
            return null;
        }

        $cost = (int) ($type === 'pasca' ? ($item['admin'] ?? 0) : ($item['price'] ?? 0));

        $supplier = Supplier::where('name', 'Digiflazz')->first();
        $alreadyMapped = $supplier
            ? SupplierProduct::where('supplier_id', $supplier->id)->where('buyer_sku_code', $sku)->exists()
            : false;

        $existingProduct = Product::where('code', $sku)->first(['id', 'name', 'code']);

        return [
            'buyer_sku_code' => $sku,
            'name' => (string) ($item['product_name'] ?? ''),
            'brand' => (string) ($item['brand'] ?? ''),
            'category' => (string) ($item['category'] ?? ''),
            'type' => $type,
            'cost' => $cost,
            'admin_fee' => $type === 'pasca' ? (int) ($item['admin'] ?? 0) : null,
            'commission' => $type === 'pasca' ? (int) ($item['commission'] ?? 0) : null,
            'available' => (bool) ($item['buyer_product_status'] ?? false)
                && (bool) ($item['seller_product_status'] ?? false),
            'already_mapped' => $alreadyMapped,
            'existing_product' => $existingProduct,
            'suggested_prices' => $this->pricingService->computePrices($cost, $categoryId),
        ];
    }
}
