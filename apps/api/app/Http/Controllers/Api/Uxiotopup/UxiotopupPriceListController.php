<?php

namespace App\Http\Controllers\Api\Uxiotopup;

use App\Actions\Uxiotopup\ListUxiotopupPriceListAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiotopup\PriceListQueryRequest;
use App\Http\Resources\Api\Uxiotopup\UxiotopupPriceListItemResource;
use App\Traits\ApiResponse;
use Throwable;

class UxiotopupPriceListController extends Controller
{
    use ApiResponse;

    public function index(PriceListQueryRequest $request, ListUxiotopupPriceListAction $action)
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
            return $this->errorResponse('Gagal mengambil price list uxiotopup: '.$e->getMessage(), 502);
        }

        return $this->paginatedResponse(
            UxiotopupPriceListItemResource::collection($paginator),
            'Price list uxiotopup'
        );
    }
}
