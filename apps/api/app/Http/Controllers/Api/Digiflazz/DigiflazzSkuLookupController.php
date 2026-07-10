<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\LookupDigiflazzSkuAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Digiflazz\SkuLookupRequest;
use App\Traits\ApiResponse;
use Exception;

class DigiflazzSkuLookupController extends Controller
{
    use ApiResponse;

    public function show(SkuLookupRequest $request, LookupDigiflazzSkuAction $action)
    {
        try {
            $preview = $action->execute(
                $request->string('buyer_sku_code')->toString(),
                $request->string('type')->toString() ?: 'prepaid',
                $request->filled('category_id') ? (int) $request->validated('category_id') : null
            );
        } catch (Exception $e) {
            return $this->errorResponse('Gagal mengambil price list Digiflazz: '.$e->getMessage(), 502);
        }

        if ($preview === null) {
            return $this->errorResponse('SKU tidak ditemukan di price list Digiflazz', 404);
        }

        return $this->successResponse($preview, 'SKU ditemukan');
    }
}
