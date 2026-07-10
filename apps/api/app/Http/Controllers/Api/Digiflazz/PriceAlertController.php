<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\AcknowledgeAllPriceAlertsAction;
use App\Actions\Digiflazz\AcknowledgePriceAlertAction;
use App\Actions\Digiflazz\GetPriceAlertsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Digiflazz\GetPriceAlertsRequest;
use App\Models\PriceChangeAlert;
use App\Traits\ApiResponse;

class PriceAlertController extends Controller
{
    use ApiResponse;

    public function index(GetPriceAlertsRequest $request, GetPriceAlertsAction $action)
    {
        $alerts = $action->execute(
            $request->validated('status'),
            (int) ($request->validated('per_page') ?? 15)
        );

        return $this->successResponse([
            'data' => $alerts->items(),
            'meta' => [
                'current_page' => $alerts->currentPage(),
                'last_page' => $alerts->lastPage(),
                'per_page' => $alerts->perPage(),
                'total' => $alerts->total(),
            ],
        ], 'Price alerts retrieved successfully');
    }

    public function acknowledge(PriceChangeAlert $priceChangeAlert, AcknowledgePriceAlertAction $action)
    {
        return $this->successResponse(
            $action->execute($priceChangeAlert),
            'Alert ditandai selesai'
        );
    }

    public function acknowledgeAll(AcknowledgeAllPriceAlertsAction $action)
    {
        $count = $action->execute();

        return $this->successResponse(
            ['acknowledged' => $count],
            "{$count} alert ditandai selesai"
        );
    }
}
