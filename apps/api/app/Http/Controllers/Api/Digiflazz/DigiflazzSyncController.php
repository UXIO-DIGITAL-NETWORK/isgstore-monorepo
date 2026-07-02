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
            $count = $action->execute($type);

            return $this->successResponse(
                ['synced' => $count, 'type' => $type],
                "Berhasil sinkronisasi {$count} produk Digiflazz ({$type})"
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 502);
        }
    }
}
