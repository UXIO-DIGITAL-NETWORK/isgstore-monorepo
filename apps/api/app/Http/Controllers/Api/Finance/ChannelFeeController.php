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
            ->map(fn (PaymentChannel $c) => $this->present($c));

        return $this->successResponse($channels, 'Channels retrieved successfully');
    }

    public function update(Request $request, PaymentChannel $paymentChannel)
    {
        $validated = $request->validate([
            'fee_flat' => ['sometimes', 'integer', 'min:0'],
            'fee_percent' => ['sometimes', 'numeric', 'between:0,100'],
            // The gateway's cut of each payment through this channel; subtracted
            // from the admin fee to leave kita's profit.
            'gateway_fee_percent' => ['sometimes', 'numeric', 'between:0,100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $paymentChannel->update($validated);

        return $this->successResponse($this->present($paymentChannel), 'Biaya channel berhasil disimpan');
    }

    /** One shape for both the list and the update response — never edited apart. */
    private function present(PaymentChannel $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'channel_code' => $c->channel_code,
            'payment_type' => $c->payment_type,
            'min_amount' => (int) $c->min_amount,
            'fee_flat' => (int) $c->fee_flat,
            'fee_percent' => (float) $c->fee_percent,
            'gateway_fee_percent' => (float) $c->gateway_fee_percent,
            'is_active' => (bool) $c->is_active,
        ];
    }
}
