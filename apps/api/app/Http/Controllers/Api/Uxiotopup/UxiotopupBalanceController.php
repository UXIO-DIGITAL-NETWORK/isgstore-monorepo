<?php

namespace App\Http\Controllers\Api\Uxiotopup;

use App\Actions\Uxiotopup\CheckUxiotopupBalanceAction;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Exception;

class UxiotopupBalanceController extends Controller
{
    use ApiResponse;

    public function index(CheckUxiotopupBalanceAction $action)
    {
        try {
            $data = $action->execute();

            return $this->successResponse($data, 'Saldo uxiotopup berhasil diambil');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 502);
        }
    }
}
