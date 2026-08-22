<?php

namespace App\Http\Requests\Uxiotopup;

use Illuminate\Foundation\Http\FormRequest;

class SkuLookupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'buyer_sku_code' => ['required', 'string', 'max:255'],
            // Optional: used to compute suggested selling prices per category rules
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
        ];
    }
}
