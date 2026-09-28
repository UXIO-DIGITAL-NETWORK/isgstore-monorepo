<?php

namespace App\Actions\Uxiolabs;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Pricing\WriteProductPricesAction;
use App\Contracts\SupplierGateway;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Uxiolabs\CreateUxiolabsProductDTO;
use App\Exceptions\UxiolabsProductException;
use App\Models\Product;
use App\Models\SupplierProduct;
use App\Services\PricingService;
use App\Services\ProductRepricer;
use App\Support\Uxiolabs\UxiolabsSupplier;
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
        private readonly SupplierGateway $uxiolabsService,
        private readonly PricingService $pricingService,
        private readonly WriteProductPricesAction $writePrices,
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(CreateUxiolabsProductDTO $dto): Product
    {
        $item = $this->uxiolabsService->findServiceInPriceList($dto->buyerSkuCode);

        if ($item === null) {
            throw new UxiolabsProductException('Layanan tidak ditemukan di price list Uxiotopup.');
        }

        $cost = $this->uxiolabsService->costFor($item);

        if ($cost <= 0) {
            throw new UxiolabsProductException('Layanan ditemukan tetapi harga modal dari Uxiotopup tidak valid.');
        }

        $supplier = UxiolabsSupplier::modelOrFail();

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

        $available = $this->uxiolabsService->isItemActive($item);

        // The same prices, where they are actually billed.
        $planPrices = $this->planPricesFor($cost, $dto);

        $product = DB::transaction(function () use ($dto, $item, $cost, $code, $prices, $planPrices, $available, $supplier) {
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

            // In the same transaction as the product: a half-created product with
            // no plan row is one `PlanPrice` can only serve by falling back to
            // `price_member` and logging a warning.
            $this->writePrices->forPlans($product, $planPrices, overwriteManual: true);

            return $product;
        });

        $this->logAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()?->ip() ?? '127.0.0.1',
            userAgent: request()?->userAgent() ?? 'System/Import',
            message: "Menambahkan produk Uxiotopup manual: {$product->name} ({$dto->buyerSkuCode})"
        ));

        return $product;
    }

    /**
     * The prices that will actually be billed, one per membership plan.
     *
     * An explicit price from the form or the import sheet wins, and it has to win
     * on the plan whose price the legacy column used to hold — `planIdByRole()` is
     * the same role→plan map the legacy `computePrices()` bridge derives those
     * columns from, so `price_vip` lands on exactly the plan that granted VIP.
     *
     * @return array<int,int> Keyed by membership plan id.
     */
    private function planPricesFor(int $cost, CreateUxiolabsProductDTO $dto): array
    {
        $planPrices = $this->pricingService->computePlanPrices($cost, $dto->categoryId);
        $planByRole = ProductRepricer::planIdByRole();

        foreach ([
            'member' => $dto->priceMember,
            'vip' => $dto->priceVip,
            'reseller' => $dto->priceReseller,
            'agent' => $dto->priceAgent,
        ] as $role => $explicit) {
            $planId = $planByRole[$role] ?? null;

            if ($explicit !== null && $planId !== null) {
                $planPrices[$planId] = (int) $explicit;
            }
        }

        return $planPrices;
    }
}
