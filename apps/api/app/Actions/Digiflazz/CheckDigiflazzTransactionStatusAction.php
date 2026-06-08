<?php

namespace App\Actions\Digiflazz;

use App\Models\Transaction;
use App\Services\DigiflazzService;
use Exception;

class CheckDigiflazzTransactionStatusAction
{
    public function __construct(private readonly DigiflazzService $digiflazzService) {}

    public function execute(string $invoiceNumber): Transaction
    {
        $transaction = Transaction::where('invoice_number', $invoiceNumber)
            ->where('status', 'PROCESSING')
            ->firstOrFail();

        $supplierProduct = $transaction->product
            ->supplierProducts()
            ->where('is_active', true)
            ->first();

        if (!$supplierProduct) {
            throw new Exception("Produk tidak memiliki supplier aktif.");
        }

        $customerNo = $transaction->target_uid . ($transaction->target_server ?? '');

        $response = $this->digiflazzService->checkTransactionStatus(
            $supplierProduct->buyer_sku_code,
            $customerNo,
            $invoiceNumber
        );

        $newStatus = $this->mapInternalStatus($response['status'] ?? 'Pending');

        $transaction->update([
            'supplier_trx_id' => $response['trx_id'] ?? $transaction->supplier_trx_id,
            'sn'              => $response['sn']     ?? $transaction->sn,
            'supplier_status' => $response['status'] ?? $transaction->supplier_status,
            'status'          => $newStatus,
        ]);

        return $transaction->fresh();
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
