<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\Enums\SubscriptionStatus;
use App\Models\ServiceSubscription;
use RuntimeException;

/** Kita ends a period early. No refund is computed — that is settled offline. */
class CancelServiceSubscriptionAction
{
    public function execute(ServiceSubscription $subscription): ServiceSubscription
    {
        if ($subscription->status !== SubscriptionStatus::ACTIVE) {
            throw new RuntimeException('Langganan ini sudah tidak aktif.');
        }

        $subscription->update(['status' => SubscriptionStatus::CANCELLED]);

        return $subscription->fresh();
    }
}
