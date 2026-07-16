<?php

namespace App\Http\Controllers\Api;

use App\Actions\Dashboard\GetDashboardPerformanceAction;
use App\Actions\Dashboard\GetDashboardStatsAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

    public function performance(Request $request, GetDashboardPerformanceAction $action)
    {
        $validated = $request->validate([
            'tab' => ['required', Rule::in(['category', 'product', 'user'])],
        ]);

        return $this->successResponse(
            $action->execute($validated['tab']),
            'Dashboard performance retrieved successfully'
        );
    }
}
