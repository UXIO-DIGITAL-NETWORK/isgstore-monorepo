<?php

namespace App\Http\Controllers\Api\Uxiotopup;

use App\Actions\Uxiotopup\BulkCreateUxiotopupProductsAction;
use App\Actions\Uxiotopup\CreateUxiotopupProductAction;
use App\Exceptions\UxiotopupProductException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiotopup\BulkStoreUxiotopupProductsRequest;
use App\Http\Requests\Uxiotopup\StoreUxiotopupProductRequest;
use App\Traits\ApiResponse;
use Exception;

class UxiotopupProductController extends Controller
{
    use ApiResponse;

    public function store(StoreUxiotopupProductRequest $request, CreateUxiotopupProductAction $action)
    {
        try {
            $product = $action->execute($request->toDTO());
        } catch (UxiotopupProductException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (Exception $e) {
            return $this->errorResponse('Gagal mengambil price list uxiotopup: '.$e->getMessage(), 502);
        }

        return $this->successResponse(
            $product->load('supplierProducts'),
            'Produk berhasil dibuat',
            201
        );
    }

    public function bulkStore(BulkStoreUxiotopupProductsRequest $request, BulkCreateUxiotopupProductsAction $action)
    {
        try {
            $summary = $action->execute(
                $request->validated('buyer_sku_codes'),
                (int) $request->validated('category_id'),
                $request->filled('sub_category_id') ? (int) $request->validated('sub_category_id') : null,
                (bool) $request->validated('status'),
            );
        } catch (Exception $e) {
            return $this->errorResponse('Gagal mengambil price list uxiotopup: '.$e->getMessage(), 502);
        }

        return $this->successResponse(
            $summary,
            "Berhasil menambahkan {$summary['created']} produk",
            201
        );
    }
}
