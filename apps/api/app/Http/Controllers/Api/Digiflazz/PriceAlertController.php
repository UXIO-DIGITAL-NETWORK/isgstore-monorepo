<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\AcknowledgeAllPriceAlertsAction;
use App\Actions\Digiflazz\AcknowledgePriceAlertAction;
use App\Actions\Digiflazz\GetPriceAlertsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Digiflazz\GetPriceAlertsRequest;
use App\Models\PriceChangeAlert;
use App\Traits\ApiResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class PriceAlertController extends Controller
{
    use ApiResponse;

    public function index(GetPriceAlertsRequest $request, GetPriceAlertsAction $action)
    {
        $alerts = $action->execute(
            $request->validated('status'),
            (int) ($request->validated('per_page') ?? 15)
        );

        return $this->paginatedResponse(JsonResource::collection($alerts), 'Price alerts retrieved successfully');
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
