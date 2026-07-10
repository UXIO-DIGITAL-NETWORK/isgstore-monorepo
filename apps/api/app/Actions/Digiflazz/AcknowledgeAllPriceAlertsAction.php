<?php

namespace App\Actions\Digiflazz;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\PriceAlertStatus;
use App\Models\PriceChangeAlert;
use Illuminate\Support\Facades\Auth;

class AcknowledgeAllPriceAlertsAction
{
    public function __construct(private readonly CreateActivityLogAction $logAction) {}

    public function execute(): int
    {
        $count = PriceChangeAlert::where('status', PriceAlertStatus::PENDING->value)
            ->update([
                'status' => PriceAlertStatus::ACKNOWLEDGED->value,
                'acknowledged_at' => now(),
                'acknowledged_by' => Auth::id(),
            ]);

        if ($count > 0) {
            $this->logAction->execute(new CreateActivityLogDTO(
                userId: Auth::id(),
                ipAddress: request()->ip(),
                userAgent: request()->userAgent(),
                message: "Menandai selesai semua price alert ({$count} alert)"
            ));
        }

        return $count;
    }
}
