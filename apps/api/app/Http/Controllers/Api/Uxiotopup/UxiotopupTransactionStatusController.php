<?php

namespace App\Http\Controllers\Api\Uxiotopup;

use App\Actions\Uxiotopup\CheckUxiotopupTransactionStatusAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiotopup\CheckTransactionStatusRequest;
use App\Traits\ApiResponse;
use Exception;

class UxiotopupTransactionStatusController extends Controller
{
    use ApiResponse;

    public function check(CheckTransactionStatusRequest $request, CheckUxiotopupTransactionStatusAction $action)
    {
        try {
            $transaction = $action->execute($request->string('invoice_number')->toString());

            return $this->successResponse([
                'invoice_number' => $transaction->invoice_number,
                'status' => $transaction->status,
                'supplier_status' => $transaction->supplier_status,
                'supplier_trx_id' => $transaction->supplier_trx_id,
                'sn' => $transaction->sn,
            ], 'Status transaksi berhasil diperbarui');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
