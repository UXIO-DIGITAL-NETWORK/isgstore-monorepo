<?php

namespace App\Actions\Uxiolabs;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Uxiolabs\CreateUxiolabsProductDTO;
use App\Exceptions\UxiolabsProductException;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Services\PricingService;
use App\Services\UxiolabsService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Create a Product + uxiolabs SupplierProduct mapping from a service id.
 * Cost is pulled from the (cached) uxiolabs price list; selling prices come
 * from the DTO, falling back to PricingService when null (Excel import path).
 */
class CreateUxiolabsProductAction
{
    public function __construct(
        private readonly UxiolabsService $uxiolabsService,
        private readonly PricingService $pricingService,
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(CreateUxiolabsProductDTO $dto): Product
    {
        $item = $this->uxiolabsService->findServiceInPriceList($dto->buyerSkuCode);

        if ($item === null) {
            throw new UxiolabsProductException('Layanan tidak ditemukan di price list uxiolabs.');
        }

        $cost = $this->uxiolabsService->costFor($item);

        if ($cost <= 0) {
            throw new UxiolabsProductException('Layanan ditemukan tetapi harga modal dari uxiolabs tidak valid.');
        }

        $supplier = Supplier::where('name', 'Uxiolabs')->firstOrFail();

        if (SupplierProduct::where('supplier_id', $supplier->id)->where('buyer_sku_code', $dto->buyerSkuCode)->exists()) {
            throw new UxiolabsProductException('Layanan sudah terhubung ke produk lain.');
        }

        $code = $dto->code ?? $dto->buyerSkuCode;

        // withTrashed — see PromoteSupplierProductAction: the unique index
        // counts archived rows, so this check has to as well.
        if (Product::withTrashed()->where('code', $code)->exists()) {
            throw new UxiolabsProductException("Kode produk '{$code}' sudah dipakai.");
        }

        // Base prices from pricing rules; explicit DTO prices override per field.
        $prices = $this->pricingService->computePrices($cost, $dto->categoryId);
        $prices['price_member'] = $dto->priceMember ?? $prices['price_member'];
        $prices['price_vip'] = $dto->priceVip ?? $prices['price_vip'];
        $prices['price_reseller'] = $dto->priceReseller ?? $prices['price_reseller'];
        $prices['price_agent'] = $dto->priceAgent ?? $prices['price_agent'];

        $available = UxiolabsService::isItemActive($item);

        $product = DB::transaction(function () use ($dto, $item, $cost, $code, $prices, $available, $supplier) {
            $product = Product::create([
                'category_id' => $dto->categoryId,
                'sub_category_id' => $dto->subCategoryId,
                'name' => $dto->name ?? trim((string) ($item['nama_layanan'] ?? $dto->buyerSkuCode)),
                'code' => $code,
                'status' => $dto->status,
                ...$prices,
            ]);

            SupplierProduct::create([
                'product_id' => $product->id,
                'supplier_id' => $supplier->id,
                'buyer_sku_code' => $dto->buyerSkuCode,
                'price' => $cost,
                'admin_fee' => null,
                'commission' => null,
                'buyer_product_status' => $available,
                'seller_product_status' => $available,
                'is_active' => $available,
            ]);

            return $product;
        });

        $this->logAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()?->ip() ?? '127.0.0.1',
            userAgent: request()?->userAgent() ?? 'System/Import',
            message: "Menambahkan produk uxiolabs manual: {$product->name} ({$dto->buyerSkuCode})"
        ));

        return $product;
    }
}
