<?php

declare(strict_types=1);

namespace App\Actions\Installation;

use App\Models\ServiceInstallationDetail;

class DeleteInstallationDetailAction
{
    public function execute(ServiceInstallationDetail $detail): void
    {
        $detail->delete();
    }
}
