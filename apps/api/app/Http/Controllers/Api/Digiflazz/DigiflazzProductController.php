<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\CreateDigiflazzProductAction;
use App\Exceptions\DigiflazzProductException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Digiflazz\StoreDigiflazzProductRequest;
use App\Traits\ApiResponse;
use Exception;

class DigiflazzProductController extends Controller
{
    use ApiResponse;

    public function store(StoreDigiflazzProductRequest $request, CreateDigiflazzProductAction $action)
    {
        try {
            $product = $action->execute($request->toDTO());
        } catch (DigiflazzProductException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (Exception $e) {
            return $this->errorResponse('Gagal mengambil price list Digiflazz: '.$e->getMessage(), 502);
        }

        return $this->successResponse(
            $product->load('supplierProducts'),
            'Produk berhasil dibuat',
            201
        );
    }
}
