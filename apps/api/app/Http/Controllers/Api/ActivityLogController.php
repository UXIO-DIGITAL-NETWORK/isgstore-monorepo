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
        $logs = ActivityLog::with('user.role')
            ->latest()
            ->paginate(min(100, max(1, (int) $request->query('per_page', 15))));

        return $this->paginatedResponse(ActivityLogResource::collection($logs), 'Activity logs retrieved successfully');
    }
}
