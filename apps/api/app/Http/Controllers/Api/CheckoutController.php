<?php

namespace App\Http\Controllers\Api;

use App\Actions\Checkout\CheckoutAction;
use App\DTOs\Checkout\CheckoutDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Checkout\StoreCheckoutRequest;
use App\Traits\ApiResponse;
use Exception;

class CheckoutController extends Controller
{
    use ApiResponse;

    public function store(StoreCheckoutRequest $request, CheckoutAction $action)
    {
        try {
            $dto = new CheckoutDTO(
                userId:           $request->user()?->id,
                productId:        $request->integer('product_id'),
                paymentChannelId: $request->integer('payment_channel_id'),
                targetUid:        $request->string('target_uid')->toString(),
                targetServer:     $request->string('target_server')->toString() ?: null,
                guestContact:     $request->string('guest_contact')->toString() ?: null,
            );

            $result = $action->execute($dto);

            return $this->successResponse($result, 'Checkout berhasil diproses', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
