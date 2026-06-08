<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\CheckDigiflazzTransactionStatusAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Digiflazz\CheckTransactionStatusRequest;
use App\Traits\ApiResponse;
use Exception;

class DigiflazzTransactionStatusController extends Controller
{
    use ApiResponse;

    public function check(CheckTransactionStatusRequest $request, CheckDigiflazzTransactionStatusAction $action)
    {
        try {
            $transaction = $action->execute($request->string('invoice_number')->toString());

            return $this->successResponse([
                'invoice_number'  => $transaction->invoice_number,
                'status'          => $transaction->status,
                'supplier_status' => $transaction->supplier_status,
                'supplier_trx_id' => $transaction->supplier_trx_id,
                'sn'              => $transaction->sn,
            ], 'Status transaksi berhasil diperbarui');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
