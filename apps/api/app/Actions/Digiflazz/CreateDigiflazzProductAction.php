<?php

namespace App\Actions\Digiflazz;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Digiflazz\CreateDigiflazzProductDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Exceptions\DigiflazzProductException;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Services\DigiflazzService;
use App\Services\PricingService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Create a Product + Digiflazz SupplierProduct mapping from a buyer_sku_code.
 * Cost is pulled from the (cached) Digiflazz price list; selling prices come
 * from the DTO, falling back to PricingService when null (Excel import path).
 */
class CreateDigiflazzProductAction
{
    public function __construct(
        private readonly DigiflazzService $digiflazzService,
        private readonly PricingService $pricingService,
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(CreateDigiflazzProductDTO $dto): Product
    {
        $item = $this->digiflazzService->findSkuInPriceList($dto->buyerSkuCode, $dto->type);

        if ($item === null) {
            throw new DigiflazzProductException('SKU tidak ditemukan di price list Digiflazz.');
        }

        $cost = (int) ($dto->type === 'pasca' ? ($item['admin'] ?? 0) : ($item['price'] ?? 0));

        if ($cost <= 0) {
            throw new DigiflazzProductException('SKU ditemukan tetapi harga modal dari Digiflazz tidak valid.');
        }

        $supplier = Supplier::where('name', 'Digiflazz')->firstOrFail();

        if (SupplierProduct::where('supplier_id', $supplier->id)->where('buyer_sku_code', $dto->buyerSkuCode)->exists()) {
            throw new DigiflazzProductException('SKU sudah terhubung ke produk lain.');
        }

        $code = $dto->code ?? $dto->buyerSkuCode;

        if (Product::where('code', $code)->exists()) {
            throw new DigiflazzProductException("Kode produk '{$code}' sudah dipakai.");
        }

        // Base prices from pricing rules; explicit DTO prices override per field.
        $prices = $this->pricingService->computePrices($cost, $dto->categoryId);
        $prices['price_member'] = $dto->priceMember ?? $prices['price_member'];
        $prices['price_vip'] = $dto->priceVip ?? $prices['price_vip'];
        $prices['price_reseller'] = $dto->priceReseller ?? $prices['price_reseller'];
        $prices['price_agent'] = $dto->priceAgent ?? $prices['price_agent'];

        $available = (bool) ($item['buyer_product_status'] ?? false)
            && (bool) ($item['seller_product_status'] ?? false);

        $product = DB::transaction(function () use ($dto, $item, $cost, $code, $prices, $available, $supplier) {
            $product = Product::create([
                'category_id' => $dto->categoryId,
                'sub_category_id' => $dto->subCategoryId,
                'name' => $dto->name ?? trim((string) ($item['product_name'] ?? $dto->buyerSkuCode)),
                'code' => $code,
                'status' => $dto->status,
                ...$prices,
            ]);

            SupplierProduct::create([
                'product_id' => $product->id,
                'supplier_id' => $supplier->id,
                'buyer_sku_code' => $dto->buyerSkuCode,
                'price' => $cost,
                'admin_fee' => $dto->type === 'pasca' ? (int) ($item['admin'] ?? 0) : null,
                'commission' => $dto->type === 'pasca' ? (int) ($item['commission'] ?? 0) : null,
                'buyer_product_status' => (bool) ($item['buyer_product_status'] ?? false),
                'seller_product_status' => (bool) ($item['seller_product_status'] ?? false),
                'is_active' => $available,
            ]);

            return $product;
        });

        $this->logAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()?->ip() ?? '127.0.0.1',
            userAgent: request()?->userAgent() ?? 'System/Import',
            message: "Menambahkan produk Digiflazz manual: {$product->name} ({$dto->buyerSkuCode})"
        ));

        return $product;
    }
}
