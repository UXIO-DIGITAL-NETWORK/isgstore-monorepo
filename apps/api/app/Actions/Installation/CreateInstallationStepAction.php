<?php

declare(strict_types=1);

namespace App\Actions\Installation;

use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationStep;
use Illuminate\Support\Facades\DB;

class CreateInstallationStepAction
{
    public function execute(ServiceInstallation $installation, array $data): ServiceInstallationStep
    {
        return DB::transaction(function () use ($installation, $data) {
            // Default to the end of the list, resolved inside the transaction so
            // two concurrent adds cannot land on the same order.
            $sortOrder = $data['sort_order']
                ?? ((int) $installation->steps()->max('sort_order') + 1);

            return ServiceInstallationStep::create([
                'service_installation_id' => $installation->id,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'sort_order' => $sortOrder,
            ]);
        });
    }
}
