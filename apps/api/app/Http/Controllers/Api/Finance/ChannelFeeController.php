<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\PaymentChannel;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * Payment-internal ("kita") manages the fee per payment method (biaya per
 * metode pembayaran). Only fee fields and the active toggle are editable here —
 * channel creation/deletion stays with the admin PaymentChannelController.
 */
class ChannelFeeController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $channels = PaymentChannel::query()
            ->orderBy('payment_type')
            ->orderBy('name')
            ->get()
            ->map(fn (PaymentChannel $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'channel_code' => $c->channel_code,
                'payment_type' => $c->payment_type,
                'min_amount' => (int) $c->min_amount,
                'fee_flat' => (int) $c->fee_flat,
                'fee_percent' => (float) $c->fee_percent,
                'is_active' => (bool) $c->is_active,
            ]);

        return $this->successResponse($channels, 'Channels retrieved successfully');
    }

    public function update(Request $request, PaymentChannel $paymentChannel)
    {
        $validated = $request->validate([
            'fee_flat' => ['sometimes', 'integer', 'min:0'],
            'fee_percent' => ['sometimes', 'numeric', 'between:0,100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $paymentChannel->update($validated);

        return $this->successResponse([
            'id' => $paymentChannel->id,
            'name' => $paymentChannel->name,
            'channel_code' => $paymentChannel->channel_code,
            'payment_type' => $paymentChannel->payment_type,
            'min_amount' => (int) $paymentChannel->min_amount,
            'fee_flat' => (int) $paymentChannel->fee_flat,
            'fee_percent' => (float) $paymentChannel->fee_percent,
            'is_active' => (bool) $paymentChannel->is_active,
        ], 'Biaya channel berhasil disimpan');
    }
}
