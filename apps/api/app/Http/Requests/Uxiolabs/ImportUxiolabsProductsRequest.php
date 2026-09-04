<?php

namespace App\Http\Requests\Uxiolabs;

use Illuminate\Foundation\Http\FormRequest;

class ImportUxiolabsProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx', 'max:2048'],
        ];
    }
}
