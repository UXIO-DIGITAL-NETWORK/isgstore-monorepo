<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\CheckDigiflazzPricesAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Digiflazz\SyncProductsRequest;
use App\Traits\ApiResponse;
use Exception;

class DigiflazzSyncController extends Controller
{
    use ApiResponse;

    public function sync(SyncProductsRequest $request, CheckDigiflazzPricesAction $action)
    {
        try {
            $type = $request->string('type')->toString() ?: 'prepaid';
            $report = $action->execute($type);

            return $this->successResponse(
                $report->toArray(),
                "Cek harga selesai: {$report->totalFetched} SKU Digiflazz ({$type}), {$report->priceChangedCount} perubahan modal"
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 502);
        }
    }
}
