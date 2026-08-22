<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\ListCekUsernameSkusAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Throwable;

class DigiflazzCekUsernameSkuController extends Controller
{
    use ApiResponse;

    public function index(ListCekUsernameSkusAction $action)
    {
        try {
            $skus = $action->execute();
        } catch (Throwable $e) {
            // Catch Throwable, not just Exception: a malformed upstream payload
            // can surface as a TypeError (an Error), which must degrade to a
            // clean 502 rather than an uncaught 500.
            return $this->errorResponse('Gagal mengambil price list Digiflazz: '.$e->getMessage(), 502);
        }

        return $this->successResponse($skus, 'Cek-username SKU Digiflazz');
    }
}
