<?php

namespace App\Http\Controllers\Api\Uxiolabs;

use App\Actions\Uxiolabs\BulkCreateUxiolabsProductsAction;
use App\Actions\Uxiolabs\CreateUxiolabsProductAction;
use App\Exceptions\UxiolabsProductException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiolabs\BulkStoreUxiolabsProductsRequest;
use App\Http\Requests\Uxiolabs\StoreUxiolabsProductRequest;
use App\Traits\ApiResponse;
use Exception;

class UxiolabsProductController extends Controller
{
    use ApiResponse;

    public function store(StoreUxiolabsProductRequest $request, CreateUxiolabsProductAction $action)
    {
        try {
            $product = $action->execute($request->toDTO());
        } catch (UxiolabsProductException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (Exception $e) {
            return $this->errorResponse('Gagal mengambil price list uxiolabs: '.$e->getMessage(), 502);
        }

        return $this->successResponse(
            $product->load('supplierProducts'),
            'Produk berhasil dibuat',
            201
        );
    }

    public function bulkStore(BulkStoreUxiolabsProductsRequest $request, BulkCreateUxiolabsProductsAction $action)
    {
        try {
            $summary = $action->execute(
                $request->validated('buyer_sku_codes'),
                (int) $request->validated('category_id'),
                $request->filled('sub_category_id') ? (int) $request->validated('sub_category_id') : null,
                (bool) $request->validated('status'),
            );
        } catch (Exception $e) {
            return $this->errorResponse('Gagal mengambil price list uxiolabs: '.$e->getMessage(), 502);
        }

        return $this->successResponse(
            $summary,
            "Berhasil menambahkan {$summary['created']} produk",
            201
        );
    }
}
