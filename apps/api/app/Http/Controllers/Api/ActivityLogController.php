<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\ActivityLogResource;
use App\Models\ActivityLog;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $logs = ActivityLog::latest()->paginate(15);

        return $this->successResponse([
            'data' => ActivityLogResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ], 'Activity logs retrieved successfully');
    }
}
