<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\DTOs\Service\SubscribeToServiceDTO;
use App\Enums\ServiceInvoiceStatus;
use App\Models\Service;
use App\Models\ServiceInvoice;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * A client asks to subscribe to a service. This issues an UNPAID invoice and
 * nothing more — no ledger movement, no subscription row. The subscription only
 * comes into existence once kita confirms the bukti transfer.
 */
class SubscribeToServiceAction
{
    public function execute(SubscribeToServiceDTO $dto): ServiceInvoice
    {
        return DB::transaction(function () use ($dto) {
            /** @var Service $service */
            $service = Service::whereKey($dto->serviceId)->firstOrFail();

            if (! $service->is_active) {
                throw new RuntimeException('Service ini sedang tidak tersedia.');
            }

            // One open bill per (client, service). Without this a double-tap
            // leaves two invoices the client could pay twice over.
            $hasOpenInvoice = ServiceInvoice::query()
                ->where('merchant_id', $dto->merchantId)
                ->where('service_id', $service->id)
                ->whereIn('status', [
                    ServiceInvoiceStatus::UNPAID,
                    ServiceInvoiceStatus::WAITING_CONFIRMATION,
                ])
                ->exists();

            if ($hasOpenInvoice) {
                throw new RuntimeException('Masih ada invoice yang belum selesai untuk service ini.');
            }

            return ServiceInvoice::create([
                'invoice_number' => 'SINV-'.date('Ym').'-'.strtoupper(Str::random(6)),
                'merchant_id' => $dto->merchantId,
                'service_id' => $service->id,
                // Snapshot: the catalogue may be repriced before this is paid.
                'service_name' => $service->name,
                'amount' => (int) $service->selling_price,
                'duration_days' => (int) $service->duration_days,
                'status' => ServiceInvoiceStatus::UNPAID,
                'due_at' => now()->addDays((int) config('services.service_invoice.due_days', 3)),
                'notes' => $dto->notes,
            ]);
        });
    }
}
