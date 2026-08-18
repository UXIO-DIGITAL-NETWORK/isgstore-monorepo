<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

class PayServiceInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The `payment-admin` middleware gates the route; the controller
        // re-checks that this invoice belongs to the caller.
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'payment_channel_id' => ['required', 'integer', 'exists:payment_channels,id'],
        ];
    }
}
