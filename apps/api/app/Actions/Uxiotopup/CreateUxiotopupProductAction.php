<?php

namespace App\Actions\Uxiotopup;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Uxiotopup\CreateUxiotopupProductDTO;
use App\Exceptions\UxiotopupProductException;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Services\PricingService;
use App\Services\UxiotopupService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Create a Product + uxiotopup SupplierProduct mapping from a service id.
 * Cost is pulled from the (cached) uxiotopup price list; selling prices come
 * from the DTO, falling back to PricingService when null (Excel import path).
 */
class CreateUxiotopupProductAction
{
    public function __construct(
        private readonly UxiotopupService $uxiotopupService,
        private readonly PricingService $pricingService,
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(CreateUxiotopupProductDTO $dto): Product
    {
        $item = $this->uxiotopupService->findServiceInPriceList($dto->buyerSkuCode);

        if ($item === null) {
            throw new UxiotopupProductException('Layanan tidak ditemukan di price list uxiotopup.');
        }

        $cost = $this->uxiotopupService->costFor($item);

        if ($cost <= 0) {
            throw new UxiotopupProductException('Layanan ditemukan tetapi harga modal dari uxiotopup tidak valid.');
        }

        $supplier = Supplier::where('name', 'Uxiotopup')->firstOrFail();

        if (SupplierProduct::where('supplier_id', $supplier->id)->where('buyer_sku_code', $dto->buyerSkuCode)->exists()) {
            throw new UxiotopupProductException('Layanan sudah terhubung ke produk lain.');
        }

        $code = $dto->code ?? $dto->buyerSkuCode;

        // withTrashed — see PromoteSupplierProductAction: the unique index
        // counts archived rows, so this check has to as well.
        if (Product::withTrashed()->where('code', $code)->exists()) {
            throw new UxiotopupProductException("Kode produk '{$code}' sudah dipakai.");
        }

        // Base prices from pricing rules; explicit DTO prices override per field.
        $prices = $this->pricingService->computePrices($cost, $dto->categoryId);
        $prices['price_member'] = $dto->priceMember ?? $prices['price_member'];
        $prices['price_vip'] = $dto->priceVip ?? $prices['price_vip'];
        $prices['price_reseller'] = $dto->priceReseller ?? $prices['price_reseller'];
        $prices['price_agent'] = $dto->priceAgent ?? $prices['price_agent'];

        $available = UxiotopupService::isItemActive($item);

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
            message: "Menambahkan produk uxiotopup manual: {$product->name} ({$dto->buyerSkuCode})"
        ));

        return $product;
    }
}
