<?php

namespace App\Http\Requests\Refund;

use Illuminate\Foundation\Http\FormRequest;

class CompleteRefundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Bukti transfer. Same allowances as the manual-review proof.
            'proof' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:2048'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
