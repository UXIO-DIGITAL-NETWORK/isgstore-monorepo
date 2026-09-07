<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\Models\Service;

class UpdateServiceAction
{
    public function execute(Service $service, array $data): Service
    {
        $service->update($data);

        return $service->fresh();
    }
}
