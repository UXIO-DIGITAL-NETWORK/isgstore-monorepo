<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Actions\Storefront\ListGameProductsAction;
use App\Actions\Storefront\ListGamesAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ListGamesRequest;
use App\Http\Resources\Api\Storefront\GameDetailResource;
use App\Http\Resources\Api\Storefront\GameResource;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public game catalog.
 *
 * Anonymous by design, but reads the bearer token when one is present so a
 * signed-in reseller is quoted their own tier price instead of the guest price.
 */
class GameController extends Controller
{
    use ApiResponse;

    public function index(ListGamesRequest $request, ListGamesAction $action): JsonResponse
    {
        return $this->paginatedResponse(
            GameResource::collection($action->execute($request->toDTO())),
            'Games retrieved successfully'
        );
    }

    public function show(Category $game): JsonResponse
    {
        return $this->successResponse(
            new GameDetailResource($game->load('categoryType:id,name')),
            'Game retrieved successfully'
        );
    }

    public function products(Request $request, Category $game, ListGameProductsAction $action): JsonResponse
    {
        return $this->successResponse(
            $action->execute($game, $request->user('sanctum')),
            'Products retrieved successfully'
        );
    }
}
