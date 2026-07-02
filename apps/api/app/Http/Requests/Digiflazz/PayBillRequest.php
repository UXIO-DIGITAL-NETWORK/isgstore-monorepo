<?php

namespace App\Http\Requests\Digiflazz;

use Illuminate\Foundation\Http\FormRequest;

class PayBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id'         => ['required', 'integer', 'exists:products,id'],
            'payment_channel_id' => ['required', 'integer', 'exists:payment_channels,id'],
            'customer_no'        => ['required', 'string', 'max:50'],
            'guest_contact'      => $this->user()
                ? ['nullable', 'string', 'max:20']
                : ['required', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'guest_contact.required' => 'Nomor WhatsApp/Kontak wajib diisi untuk pelanggan tamu.',
        ];
    }
}
