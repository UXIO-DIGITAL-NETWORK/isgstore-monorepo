<?php

namespace App\Http\Controllers\Api\Uxiotopup;

use App\Actions\Uxiotopup\LookupUxiotopupSkuAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiotopup\SkuLookupRequest;
use App\Traits\ApiResponse;
use Exception;

class UxiotopupSkuLookupController extends Controller
{
    use ApiResponse;

    public function show(SkuLookupRequest $request, LookupUxiotopupSkuAction $action)
    {
        try {
            $preview = $action->execute(
                $request->string('buyer_sku_code')->toString(),
                $request->filled('category_id') ? (int) $request->validated('category_id') : null
            );
        } catch (Exception $e) {
            return $this->errorResponse('Gagal mengambil price list uxiotopup: '.$e->getMessage(), 502);
        }

        if ($preview === null) {
            return $this->errorResponse('Layanan tidak ditemukan di price list uxiotopup', 404);
        }

        return $this->successResponse($preview, 'Layanan ditemukan');
    }
}
