<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use App\Models\Rating;
use App\Http\Resources\Api\Rating\RatingResource;
use App\Http\Requests\Rating\StoreRatingRequest;
use App\Http\Requests\Rating\UpdateRatingRequest;
use App\Actions\Rating\GetRatingsAction;
use App\Actions\Rating\CreateRatingAction;
use App\Actions\Rating\UpdateRatingAction;
use App\Actions\Rating\DeleteRatingAction;

class RatingController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetRatingsAction $action)
    {
        $perPage = $request->query('per_page', 15);
        $ratings = $action->execute((int) $perPage);
        return RatingResource::collection($ratings);
    }

    public function store(StoreRatingRequest $request, CreateRatingAction $action)
    {
        $rating = $action->execute($request->toDTO());
        return $this->success(
            new RatingResource($rating->load(['transaction', 'user'])),
            'Rating created successfully',
            201
        );
    }

    public function show(Rating $rating)
    {
        return $this->success(
            new RatingResource($rating->load(['transaction', 'user'])),
            'Rating retrieved successfully'
        );
    }

    public function update(UpdateRatingRequest $request, Rating $rating, UpdateRatingAction $action)
    {
        $rating = $action->execute($rating, $request->toDTO());
        return $this->success(
            new RatingResource($rating->load(['transaction', 'user'])),
            'Rating updated successfully'
        );
    }

    public function destroy(Rating $rating, DeleteRatingAction $action)
    {
        $action->execute($rating);
        return $this->success(null, 'Rating deleted successfully');
    }
}
