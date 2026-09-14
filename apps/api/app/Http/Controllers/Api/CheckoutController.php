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
                // Resolved through the sanctum guard — see checkoutUser(). Using
                // $request->user() here would book a signed-in member's order as
                // a guest order and lock them out of paying from their balance.
                userId: $request->checkoutUser()?->id,
                productId: $request->integer('product_id'),
                paymentChannelId: $request->integer('payment_channel_id'),
                targetUid: trim($request->string('target_uid')->toString()),
                targetServer: ($s = trim($request->string('target_server')->toString())) !== '' ? $s : null,
                // The keyed identifier set, when the client sent one. Values are
                // trimmed here; the category's schema decides which keys matter.
                orderFields: array_map(
                    static fn ($value) => is_scalar($value) ? trim((string) $value) : '',
                    (array) $request->input('order_fields', []),
                ),
                guestContact: $request->string('guest_contact')->toString() ?: null,
                targetNickname: ($n = trim($request->string('target_nickname')->toString())) !== '' ? $n : null,
                promoCode: ($p = trim($request->string('promo_code')->toString())) !== '' ? $p : null,
                email: trim($request->string('email')->toString()) ?: null,
                locale: ($l = trim($request->string('locale')->toString())) !== '' ? $l : null,
                pointsToSpend: max(0, $request->integer('points_to_spend')),
            );

            $result = $action->execute($dto);

            return $this->successResponse($result, 'Checkout berhasil diproses', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
