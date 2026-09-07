<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class PromoteSupplierProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // All optional: the pool row already knows its category (from the
            // Category Provider mapping), its name and its SKU. These exist so an
            // admin can override before the product is created, not because the
            // promote needs input.
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'sub_category_id' => ['nullable', 'integer', 'exists:sub_categories,id'],
            'name' => ['nullable', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:255'],
        ];
    }
}
