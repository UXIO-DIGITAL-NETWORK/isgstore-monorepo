<?php

namespace App\Http\Controllers\Api\Uxiolabs;

use App\Actions\Uxiolabs\LookupUxiolabsSkuAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiolabs\SkuLookupRequest;
use App\Traits\ApiResponse;
use Exception;

class UxiolabsSkuLookupController extends Controller
{
    use ApiResponse;

    public function show(SkuLookupRequest $request, LookupUxiolabsSkuAction $action)
    {
        try {
            $preview = $action->execute(
                $request->string('buyer_sku_code')->toString(),
                $request->filled('category_id') ? (int) $request->validated('category_id') : null
            );
        } catch (Exception $e) {
            return $this->errorResponse('Gagal mengambil price list uxiolabs: '.$e->getMessage(), 502);
        }

        if ($preview === null) {
            return $this->errorResponse('Layanan tidak ditemukan di price list uxiolabs', 404);
        }

        return $this->successResponse($preview, 'Layanan ditemukan');
    }
}
