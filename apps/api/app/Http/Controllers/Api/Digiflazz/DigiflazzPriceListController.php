<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\ListDigiflazzPriceListAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Digiflazz\PriceListQueryRequest;
use App\Http\Resources\Api\Digiflazz\DigiflazzPriceListItemResource;
use App\Traits\ApiResponse;
use Exception;

class DigiflazzPriceListController extends Controller
{
    use ApiResponse;

    public function index(PriceListQueryRequest $request, ListDigiflazzPriceListAction $action)
    {
        try {
            $paginator = $action->execute(
                $request->string('type')->toString() ?: 'prepaid',
                $request->query('search'),
                $request->boolean('only_unmapped'),
                min(100, max(1, (int) $request->query('per_page', 15))),
                max(1, (int) $request->query('page', 1)),
            );
        } catch (Exception $e) {
            return $this->errorResponse('Gagal mengambil price list Digiflazz: '.$e->getMessage(), 502);
        }

        return $this->paginatedResponse(
            DigiflazzPriceListItemResource::collection($paginator),
            'Price list Digiflazz'
        );
    }
}
