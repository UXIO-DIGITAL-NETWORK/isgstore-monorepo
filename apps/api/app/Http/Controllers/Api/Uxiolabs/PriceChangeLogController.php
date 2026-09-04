<?php

namespace App\Http\Controllers\Api\Uxiolabs;

use App\Actions\Uxiolabs\GetPriceChangeLogsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiolabs\GetPriceChangeLogsRequest;
use App\Http\Resources\Api\Uxiolabs\PriceChangeLogResource;
use App\Traits\ApiResponse;

class PriceChangeLogController extends Controller
{
    use ApiResponse;

    public function index(GetPriceChangeLogsRequest $request, GetPriceChangeLogsAction $action)
    {
        $logs = $action->execute($request->toDTO());

        return $this->paginatedResponse(
            PriceChangeLogResource::collection($logs),
            'Price change logs retrieved successfully'
        );
    }
}
