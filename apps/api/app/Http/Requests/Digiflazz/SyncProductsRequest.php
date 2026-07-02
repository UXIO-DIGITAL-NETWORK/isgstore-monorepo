<?php

namespace App\Http\Requests\Digiflazz;

use Illuminate\Foundation\Http\FormRequest;

class SyncProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', 'in:prepaid,pasca'],
        ];
    }
}
