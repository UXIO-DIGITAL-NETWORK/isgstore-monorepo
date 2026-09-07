<?php

declare(strict_types=1);

namespace App\Actions\Installation;

use App\DTOs\Installation\InstallationTargetDTO;
use App\Models\ServiceInstallation;
use Illuminate\Support\Facades\DB;

/**
 * Schedules (or reschedules) the installation window for a client's service.
 *
 * The single writer of the installation row. firstOrCreate on the unique
 * (merchant_id, service_id) key, so it covers all three ways a row comes into
 * being — prepared from an invoice before confirmation, created by
 * confirmation itself, or backfilled onto a comped subscription. The database's
 * unique key is what guarantees one installation per service account, not each
 * call site remembering to check.
 */
class UpsertServiceInstallationAction
{
    public function execute(InstallationTargetDTO $target, array $data): ServiceInstallation
    {
        return DB::transaction(function () use ($target, $data) {
            $installation = ServiceInstallation::firstOrCreate(
                [
                    'merchant_id' => $target->merchantId,
                    'service_id' => $target->serviceId,
                ],
                ['service_subscription_id' => $target->serviceSubscriptionId],
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
