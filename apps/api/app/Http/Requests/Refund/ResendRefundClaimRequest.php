<?php

namespace App\Http\Requests\Refund;

use Illuminate\Foundation\Http\FormRequest;

/**
 * "I lost the refund email." Both identifiers are required and both must match:
 * one of them alone is not enough to be handed control of where money goes.
 */
class ResendRefundClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_number' => ['required', 'string', 'max:64'],
            // Email or WhatsApp number — whichever the customer used at checkout.
            'contact' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'invoice_number.required' => 'Nomor invoice wajib diisi.',
            'contact.required' => 'Email atau nomor WhatsApp wajib diisi.',
        ];
    }
}
