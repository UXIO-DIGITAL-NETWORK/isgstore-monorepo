<?php

namespace App\Http\Controllers\Api;

use App\Actions\Report\GetReportSummaryAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use ApiResponse;

    public function summary(Request $request, GetReportSummaryAction $action)
    {
        $period = $request->query('period') === 'monthly' ? 'monthly' : 'daily';

        return $this->successResponse($action->execute($period), 'Report summary retrieved successfully');
    }
}
