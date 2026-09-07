<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Actions\Storefront\ListPriceListAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ListPriceListRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class PriceListController extends Controller
{
    use ApiResponse;

    public function index(ListPriceListRequest $request, ListPriceListAction $action): JsonResponse
    {
        // The action already emits the exact public row shape, so it is wrapped
        // in a bare JsonResource purely to reuse the shared {data, links, meta}
        // envelope every other list endpoint returns.
        return $this->paginatedResponse(
            JsonResource::collection($action->execute($request->toDTO())),
            'Price list retrieved successfully'
        );
    }
}
