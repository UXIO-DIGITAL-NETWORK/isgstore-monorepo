<?php

namespace App\Http\Controllers\Api;

use App\Actions\PointHistory\CreatePointHistoryAction;
use App\Actions\PointHistory\DeletePointHistoryAction;
use App\Actions\PointHistory\GetPointHistoriesAction;
use App\Actions\PointHistory\UpdatePointHistoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\PointHistory\StorePointHistoryRequest;
use App\Http\Requests\PointHistory\UpdatePointHistoryRequest;
use App\Http\Resources\Api\PointHistory\PointHistoryResource;
use App\Models\PointHistory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PointHistoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetPointHistoriesAction $action)
    {
        $perPage = $request->query('per_page', 15);
        $pointHistories = $action->execute((int) $perPage);

        return $this->paginatedResponse(PointHistoryResource::collection($pointHistories), 'Point histories retrieved successfully');
    }

    public function store(StorePointHistoryRequest $request, CreatePointHistoryAction $action)
    {
        $pointHistory = $action->execute($request->toDTO());

        return $this->successResponse(
            new PointHistoryResource($pointHistory->load(['user', 'transaction'])),
            'Point History created successfully',
            201
        );
    }

    public function show(PointHistory $pointHistory)
    {
        return $this->successResponse(
            new PointHistoryResource($pointHistory->load(['user', 'transaction'])),
            'Point History retrieved successfully'
        );
    }

    public function update(UpdatePointHistoryRequest $request, PointHistory $pointHistory, UpdatePointHistoryAction $action)
    {
        $pointHistory = $action->execute($pointHistory, $request->toDTO());

        return $this->successResponse(
            new PointHistoryResource($pointHistory->load(['user', 'transaction'])),
            'Point History updated successfully'
        );
    }

    public function destroy(PointHistory $pointHistory, DeletePointHistoryAction $action)
    {
        $action->execute($pointHistory);

        return $this->successResponse(null, 'Point History deleted successfully');
    }
}
