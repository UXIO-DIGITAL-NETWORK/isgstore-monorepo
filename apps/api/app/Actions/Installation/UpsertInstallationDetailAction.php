<?php

declare(strict_types=1);

namespace App\Actions\Installation;

use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationDetail;
use Illuminate\Support\Facades\DB;

/**
 * Adds or edits one handed-over datum.
 *
 * On update, an absent `value` leaves the stored one untouched — that is what
 * lets an operator rename a label without the secret making a round trip
 * through the browser.
 */
class UpsertInstallationDetailAction
{
    public function create(ServiceInstallation $installation, array $data): ServiceInstallationDetail
    {
        return DB::transaction(function () use ($installation, $data) {
            $sortOrder = $data['sort_order']
                ?? ((int) $installation->details()->max('sort_order') + 1);

            return ServiceInstallationDetail::create([
                'service_installation_id' => $installation->id,
                'label' => $data['label'],
                'value' => $data['value'],
                'is_secret' => $data['is_secret'] ?? false,
                'sort_order' => $sortOrder,
            ]);
        });
    }

    public function update(ServiceInstallationDetail $detail, array $data): ServiceInstallationDetail
    {
        // Only the keys the caller actually sent; `value` omitted means "keep".
        $detail->update(array_intersect_key($data, array_flip(['label', 'value', 'is_secret', 'sort_order'])));

        return $detail->fresh();
    }
}
