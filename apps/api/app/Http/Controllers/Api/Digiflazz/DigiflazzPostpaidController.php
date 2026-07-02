<?php

namespace App\Http\Controllers\Api\Digiflazz;

use App\Actions\Digiflazz\CheckDigiflazzBillAction;
use App\Actions\Digiflazz\PayDigiflazzBillAction;
use App\DTOs\Digiflazz\CheckBillDTO;
use App\DTOs\Digiflazz\PayBillDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Digiflazz\CheckBillRequest;
use App\Http\Requests\Digiflazz\PayBillRequest;
use App\Traits\ApiResponse;
use Exception;

class DigiflazzPostpaidController extends Controller
{
    use ApiResponse;

    public function checkBill(CheckBillRequest $request, CheckDigiflazzBillAction $action)
    {
        try {
            $dto = new CheckBillDTO(
                buyerSkuCode: $request->string('buyer_sku_code')->toString(),
                customerNo: $request->string('customer_no')->toString(),
            );
            $result = $action->execute($dto);

            return $this->successResponse($result, 'Informasi tagihan berhasil diambil');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function payBill(PayBillRequest $request, PayDigiflazzBillAction $action)
    {
        try {
            $dto = new PayBillDTO(
                productId: $request->integer('product_id'),
                paymentChannelId: $request->integer('payment_channel_id'),
                customerNo: $request->string('customer_no')->toString(),
                userId: $request->user()?->id,
                guestContact: $request->string('guest_contact')->toString() ?: null,
            );
            $result = $action->execute($dto);

            return $this->successResponse($result, 'Pembayaran tagihan berhasil diproses', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
