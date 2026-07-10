<?php

namespace App\Actions\Digiflazz;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\PriceAlertStatus;
use App\Models\PriceChangeAlert;
use Illuminate\Support\Facades\Auth;

class AcknowledgePriceAlertAction
{
    public function __construct(private readonly CreateActivityLogAction $logAction) {}

    public function execute(PriceChangeAlert $alert): PriceChangeAlert
    {
        // Idempotent: acknowledging twice is a no-op
        if ($alert->status === PriceAlertStatus::ACKNOWLEDGED) {
            return $alert;
        }

        $alert->update([
            'status' => PriceAlertStatus::ACKNOWLEDGED,
            'acknowledged_at' => now(),
            'acknowledged_by' => Auth::id(),
        ]);

        $this->logAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Menandai selesai price alert: {$alert->buyer_sku_code} ({$alert->old_price} → {$alert->new_price})"
        ));

        return $alert->fresh();
    }
}
