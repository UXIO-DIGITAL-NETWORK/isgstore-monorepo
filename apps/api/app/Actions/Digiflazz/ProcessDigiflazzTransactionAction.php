<?php

namespace App\Actions\Digiflazz;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Transaction;
use App\Services\CustomerNumberFormatter;
use App\Services\DigiflazzService;
use App\Traits\MapsDigiflazzStatus;
use Exception;

class ProcessDigiflazzTransactionAction
{
    use MapsDigiflazzStatus;

    public function __construct(
        private readonly DigiflazzService $digiflazzService,
        private readonly CreateActivityLogAction $logAction,
        private readonly CustomerNumberFormatter $customerNumberFormatter
    ) {}

    public function execute(Transaction $transaction): Transaction
    {
        // Resolve the active supplier mapping for this product
        $supplierProduct = $transaction->product
            ->supplierProducts()
            ->where('is_active', true)
            ->first();

        if (! $supplierProduct) {
            throw new Exception('Produk ini belum dipetakan ke supplier aktif.');
        }

        // customer_no shape is data-driven per category (categories.order_form_fields).
        // Unconfigured categories still get the legacy UID+Server concatenation.
        $customerNo = $this->customerNumberFormatter->forTransaction($transaction);

        $response = $this->digiflazzService->createTransaction(
            $supplierProduct->buyer_sku_code,
            $customerNo,
            $transaction->invoice_number // used as Digiflazz ref_id
        );

        $transaction->update([
            'supplier_trx_id' => $response['trx_id'] ?? null,
            'sn' => $response['sn'] ?? null,
            'supplier_status' => $response['status'] ?? 'Pending',
            'status' => $this->mapDigiflazzStatus($response['status'] ?? 'Pending'),
        ]);

        $this->logAction->execute(new CreateActivityLogDTO(
            userId: null,
            ipAddress: '127.0.0.1',
            userAgent: 'System/DigiflazzWorker',
            message: "Digiflazz request sent for {$transaction->invoice_number}. Status: {$transaction->supplier_status}"
        ));

        return $transaction;
    }
}
