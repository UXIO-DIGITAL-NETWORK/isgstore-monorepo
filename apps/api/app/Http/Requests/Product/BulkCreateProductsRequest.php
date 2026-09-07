<?php

namespace App\Http\Requests\Product;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkCreateProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.code' => ['required', 'string', 'max:255'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.cost' => ['required', 'integer', 'min:0'],
            'items.*.sub_category_id' => ['nullable', 'exists:sub_categories,id'],
        ];
    }

    /**
     * @return array<int,array{code:string,name:string,cost:int,sub_category_id:?int}>
     */
    public function items(): array
    {
        return array_map(fn (array $item) => [
            'code' => $item['code'],
            'name' => $item['name'],
            'cost' => (int) $item['cost'],
            'sub_category_id' => isset($item['sub_category_id']) ? (int) $item['sub_category_id'] : null,
        ], $this->validated('items'));
    }
}
