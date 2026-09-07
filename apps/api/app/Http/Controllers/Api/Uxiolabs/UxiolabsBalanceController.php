<?php

namespace App\Http\Controllers\Api\Uxiolabs;

use App\Actions\Uxiolabs\CheckUxiolabsBalanceAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Exception;

class UxiolabsBalanceController extends Controller
{
    use ApiResponse;

    public function index(CheckUxiolabsBalanceAction $action)
    {
        try {
            $data = $action->execute();

            return $this->successResponse($data, 'Saldo uxiolabs berhasil diambil');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 502);
        }
    }
}
