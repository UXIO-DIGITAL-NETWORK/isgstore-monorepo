<?php

namespace App\Http\Requests\Checkout;

use Illuminate\Foundation\Http\FormRequest;

class StoreCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // auth guard handled at route level; guests are allowed
    }

    public function rules(): array
    {
        return [
            'product_id'         => ['required', 'integer', 'exists:products,id'],
            'payment_channel_id' => ['required', 'integer', 'exists:payment_channels,id'],
            'target_uid'         => ['required', 'string'],
            'target_server'      => ['nullable', 'string'],
            // Required for guests; optional for authenticated members
            'guest_contact'      => $this->user() ? ['nullable', 'string', 'max:20'] : ['required', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'guest_contact.required' => 'Nomor WhatsApp/Kontak wajib diisi untuk pelanggan tamu.',
        ];
    }
}
