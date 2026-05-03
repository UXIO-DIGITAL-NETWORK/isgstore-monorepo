<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use App\DTOs\Checkout\CheckoutDTO;
use App\Actions\Checkout\CheckoutAction;

class CheckoutController extends Controller
{
    use ApiResponse;

    public function store(Request $request, CheckoutAction $action)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'target_uid' => 'required|string',
            'target_server' => 'nullable|string',
        ]);

        try {
            $dto = new CheckoutDTO(
                userId: auth()->id(),
                productId: $request->product_id,
                paymentMethodId: $request->payment_method_id,
                targetUid: $request->target_uid,
                targetServer: $request->target_server
            );

            $result = $action->execute($dto);

            return $this->successResponse($result, 'Checkout berhasil diproses', 201);

        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
