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
        // Validasi dinamis: guest_contact wajib jika user tidak login
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'payment_channel_id' => 'required|exists:payment_channels,id',
            'target_uid' => 'required|string',
            'target_server' => 'nullable|string',
            'guest_contact' => auth()->check() ? 'nullable|string' : 'required|string|max:20',
        ]);

        try {
            $dto = new CheckoutDTO(
                userId: auth()->id(), // Akan mereturn null jika tidak login
                productId: $request->product_id,
                paymentChannelId: $request->payment_channel_id,
                targetUid: $request->target_uid,
                targetServer: $request->target_server,
                guestContact: $request->guest_contact
            );

            $result = $action->execute($dto);

            return $this->successResponse($result, 'Checkout berhasil diproses', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
