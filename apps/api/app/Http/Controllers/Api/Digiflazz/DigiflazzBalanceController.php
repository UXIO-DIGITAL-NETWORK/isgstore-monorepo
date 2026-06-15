<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\CheckDigiflazzBalanceAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Exception;

class DigiflazzBalanceController extends Controller
{
    use ApiResponse;

    public function index(CheckDigiflazzBalanceAction $action)
    {
        try {
            $data = $action->execute();

            return $this->successResponse($data, 'Saldo Digiflazz berhasil diambil');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 502);
        }
    }
}
