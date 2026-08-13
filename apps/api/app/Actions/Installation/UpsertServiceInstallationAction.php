<?php

declare(strict_types=1);

namespace App\Actions\Installation;

use App\Models\ServiceInstallation;
use App\Models\ServiceSubscription;
use Illuminate\Support\Facades\DB;

/**
 * Schedules (or reschedules) the installation window for a client's service.
 *
 * firstOrCreate on (merchant_id, service_id) so this also covers comped
 * subscriptions created outside the invoice flow and rows that predate the
 * feature — the database's unique key is what guarantees one installation per
 * service account, not both call sites remembering to check.
 */
class UpsertServiceInstallationAction
{
    public function execute(ServiceSubscription $subscription, array $data): ServiceInstallation
    {
        return DB::transaction(function () use ($subscription, $data) {
            $installation = ServiceInstallation::firstOrCreate(
                [
                    'merchant_id' => $subscription->merchant_id,
                    'service_id' => $subscription->service_id,
                ],
                ['service_subscription_id' => $subscription->id],
            );

            $installation->update([
                'starts_at' => $data['starts_at'] ?? null,
                'ends_at' => $data['ends_at'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            return $installation->fresh(['steps', 'details', 'service']);
        });
    }
}
