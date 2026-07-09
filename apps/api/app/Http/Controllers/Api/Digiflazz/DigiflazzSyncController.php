<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\SyncDigiflazzProductsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Digiflazz\SyncProductsRequest;
use App\Traits\ApiResponse;
use Exception;

class DigiflazzSyncController extends Controller
{
    use ApiResponse;

    public function sync(SyncProductsRequest $request, SyncDigiflazzProductsAction $action)
    {
        try {
            $type = $request->string('type')->toString() ?: 'prepaid';
            $report = $action->execute($type);

            return $this->successResponse(
                $report->toArray(),
                "Berhasil sinkronisasi {$report->totalFetched} produk Digiflazz ({$type})"
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 502);
        }
    }
}
