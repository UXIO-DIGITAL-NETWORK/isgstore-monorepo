<?php

namespace App\Actions\Digiflazz;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Transaction;
use App\Services\DigiflazzService;
use Exception;

class ProcessDigiflazzBillPaymentAction
{
    public function __construct(
        private readonly DigiflazzService $digiflazzService,
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(Transaction $transaction): Transaction
    {
        $supplierProduct = $transaction->product
            ->supplierProducts()
            ->where('is_active', true)
            ->first();

        if (!$supplierProduct) {
            throw new Exception("Produk postpaid tidak dipetakan ke supplier aktif.");
        }

        // For postpaid: customer_no is stored entirely in target_uid (no server component)
        $response = $this->digiflazzService->payBill(
            $supplierProduct->buyer_sku_code,
            $transaction->target_uid,
            $transaction->invoice_number
        );

        $transaction->update([
            'supplier_trx_id' => $response['trx_id'] ?? null,
            'sn'              => $response['sn']     ?? null,
            'supplier_status' => $response['status'] ?? 'Pending',
            'status'          => $this->mapInternalStatus($response['status'] ?? 'Pending'),
        ]);

        $this->logAction->execute(new CreateActivityLogDTO(
            userId:    null,
            ipAddress: '127.0.0.1',
            userAgent: 'System/DigiflazzPostpaidWorker',
            message:   "Digiflazz postpaid payment sent for {$transaction->invoice_number}. Status: {$transaction->supplier_status}"
        ));

        return $transaction;
    }

    private function mapInternalStatus(string $digiflazzStatus): string
    {
        return match (strtolower($digiflazzStatus)) {
            'sukses' => 'COMPLETED',
            'gagal'  => 'FAILED_PROVIDER',
            default  => 'PROCESSING',
        };
    }
}
