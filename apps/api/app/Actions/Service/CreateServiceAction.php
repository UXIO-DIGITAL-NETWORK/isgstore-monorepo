<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\Models\Service;

class CreateServiceAction
{
    public function execute(array $data): Service
    {
        return Service::create($data);
    }
}
