<?php

namespace App\Actions\Digiflazz;

use App\Services\DigiflazzService;
use App\Models\SupplierProduct;
use App\Models\Supplier;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;

class SyncDigiflazzProductsAction
{
    public function __construct(
        private readonly DigiflazzService $digiflazzService,
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(): int
    {
        $products = $this->digiflazzService->getPriceList();

        // Ambil ID supplier Digiflazz dari database
        $supplier = Supplier::where('name', 'Digiflazz')->firstOrFail();

        $count = 0;
        foreach ($products as $item) {
            SupplierProduct::updateOrCreate(
                [
                    'supplier_id' => $supplier->id,
                    'buyer_sku_code' => $item['buyer_sku_code'],
                ],
                [
                    // CAST TO INTEGER (Aturan mutlak Enterprise)
                    'price' => (int) $item['price'],
                    'buyer_product_status' => $item['buyer_product_status'],
                    'seller_product_status' => $item['seller_product_status'],
                ]
            );
            $count++;
        }

        // Catat ke Audit Trail secara eksplisit
        $this->logAction->execute(new CreateActivityLogDTO(
            userId: auth()->id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Sinkronisasi {$count} produk Digiflazz berhasil."
        ));

        return $count;
    }
}
