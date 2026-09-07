<?php

namespace App\Http\Controllers\Api\Uxiolabs;

use App\Actions\Uxiolabs\CheckUxiolabsTransactionStatusAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Uxiolabs\CheckTransactionStatusRequest;
use App\Traits\ApiResponse;
use Exception;

class UxiolabsTransactionStatusController extends Controller
{
    use ApiResponse;

    public function check(CheckTransactionStatusRequest $request, CheckUxiolabsTransactionStatusAction $action)
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
