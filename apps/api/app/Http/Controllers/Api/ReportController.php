<?php

namespace App\Http\Controllers\Api;

use App\Actions\Report\GetReportSummaryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Report\GetReportSummaryRequest;
use App\Traits\ApiResponse;

class ReportController extends Controller
{
    use ApiResponse;

    public function summary(GetReportSummaryRequest $request, GetReportSummaryAction $action)
    {
        return $this->successResponse(
            $action->execute($request->toDTO()),
            'Report summary retrieved successfully'
        );
    }
}
