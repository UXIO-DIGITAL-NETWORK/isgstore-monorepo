<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

class RejectServiceInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
