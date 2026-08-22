<?php

namespace App\Http\Requests\Uxiotopup;

use Illuminate\Foundation\Http\FormRequest;

class CheckTransactionStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_number' => ['required', 'string', 'exists:transactions,invoice_number'],
        ];
    }

    public function messages(): array
    {
        return [
            'invoice_number.exists' => 'Invoice tidak ditemukan.',
        ];
    }
}
