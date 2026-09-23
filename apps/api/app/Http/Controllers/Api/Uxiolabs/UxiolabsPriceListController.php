<?php

namespace App\Http\Controllers\Api\Uxiolabs;

use App\Actions\Uxiolabs\ListUxiolabsPriceListAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiolabs\PriceListQueryRequest;
use App\Http\Resources\Api\Uxiolabs\UxiolabsPriceListItemResource;
use App\Traits\ApiResponse;
use Throwable;

class UxiolabsPriceListController extends Controller
{
    use ApiResponse;

    public function index(PriceListQueryRequest $request, ListUxiolabsPriceListAction $action)
    {
        try {
            $paginator = $action->execute(
                $request->query('search'),
                $request->boolean('only_unmapped'),
                min(100, max(1, (int) $request->query('per_page', 15))),
                max(1, (int) $request->query('page', 1)),
            );
        } catch (Throwable $e) {
            // Catch Throwable, not just Exception: a malformed upstream payload
            // can surface as a TypeError (an Error), which must degrade to a
            // clean 502 rather than an uncaught 500.
            return $this->errorResponse('Gagal mengambil price list Uxiotopup: '.$e->getMessage(), 502);
        }

        return $this->paginatedResponse(
            UxiolabsPriceListItemResource::collection($paginator),
            'Price list Uxiotopup'
        );
    }
}
