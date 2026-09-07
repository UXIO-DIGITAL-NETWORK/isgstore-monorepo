<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Actions\Storefront\ListGameReviewsAction;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameReviewController extends Controller
{
    use ApiResponse;

    public function index(Request $request, Category $game, ListGameReviewsAction $action): JsonResponse
    {
        $perPage = min(50, max(1, $request->integer('per_page', 5)));

        return $this->successResponse(
            $action->execute($game, $perPage),
            'Reviews retrieved successfully'
        );
    }
}
