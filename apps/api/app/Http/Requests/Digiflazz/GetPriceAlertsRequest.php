<?php

namespace App\Http\Requests\Digiflazz;

use Illuminate\Foundation\Http\FormRequest;

class GetPriceAlertsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:pending,acknowledged'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
