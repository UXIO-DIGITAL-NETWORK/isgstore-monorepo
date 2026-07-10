<?php

namespace App\Http\Requests\Digiflazz;

use Illuminate\Foundation\Http\FormRequest;

class ImportDigiflazzProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx', 'max:2048'],
            'type' => ['required', 'in:prepaid,pasca'],
        ];
    }
}
