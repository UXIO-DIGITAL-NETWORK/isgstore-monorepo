<?php

namespace App\Http\Controllers\Api;

use App\Actions\Dashboard\GetDashboardStatsAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;

class DashboardController extends Controller
{
    use ApiResponse;

    public function stats(GetDashboardStatsAction $action)
    {
        return $this->successResponse(
            $action->execute(),
            'Dashboard stats retrieved successfully'
        );
    }
}
