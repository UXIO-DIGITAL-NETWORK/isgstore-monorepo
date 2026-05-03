<?php

namespace App\Actions\Digiflazz;

use App\Models\Order;
use App\Services\DigiflazzService;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Exception;

class ProcessDigiflazzTransactionAction
{
    public function __construct(
        private readonly DigiflazzService $digiflazzService,
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(Order $order): Order
    {
        // Cari mapping supplier aktif untuk produk ini
        $supplierProduct = $order->product->supplierProducts()
            ->where('is_active', true)
            ->first();

        if (!$supplierProduct) {
            throw new Exception("Produk ini belum dipetakan ke supplier aktif.");
        }

        // Format: UID + ServerID (sesuai format game di Digiflazz)
        $customerNo = $order->target_uid . $order->target_server;

        // Eksekusi tembakan API
        $response = $this->digiflazzService->createTransaction(
            $supplierProduct->buyer_sku_code,
            $customerNo,
            $order->invoice_number // ref_id
        );

        // Update database dengan response balikan
        $order->update([
            'supplier_trx_id' => $response['trx_id'] ?? null,
            'sn' => $response['sn'] ?? null,
            'supplier_status' => $response['status'] ?? 'Pending',
            'status' => $this->mapInternalStatus($response['status'] ?? 'Pending'),
        ]);

        // Catat Audit Trail dari sistem
        $this->logAction->execute(new CreateActivityLogDTO(
            userId: null, // Oleh Sistem
            ipAddress: '127.0.0.1',
            userAgent: 'System/DigiflazzWorker',
            message: "Menembak Digiflazz untuk Order {$order->invoice_number}. Status: {$order->supplier_status}"
        ));

        return $order;
    }

    private function mapInternalStatus(string $digiflazzStatus): string
    {
        return match($digiflazzStatus) {
            'Sukses' => 'Success',
            'Gagal' => 'Failed',
            default => 'Processing',
        };
    }
}
