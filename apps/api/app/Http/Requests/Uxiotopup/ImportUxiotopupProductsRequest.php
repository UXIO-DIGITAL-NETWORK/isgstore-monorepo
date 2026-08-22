<?php

namespace App\Http\Requests\Uxiotopup;

use Illuminate\Foundation\Http\FormRequest;

class ImportUxiotopupProductsRequest extends FormRequest
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
